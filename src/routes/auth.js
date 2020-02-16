const router = require('express').Router()
const passport = require('passport')
// const translate = require('../translater')
const User = require('../models/user.model')
const Session = require('../models/session.model')
const {
    validationService,
    tokenService,
    mailService,
    authService
} = require('../sevices')
const sse = require('./SSE')
const { MAX_SESSIONS_COUNT } = require('../../config')
const { fromBase64 } = require('../helpers')

router.get('/google', 
    // validationService.googleAuthValidation('query'),
    (req, res, next) => {

    const defaultScope = ['email', 'profile', 'openid']
    const values = ['false', 'true', 'undefined', 'null']

    const query = Object.entries(req.query)
        .reduce((acc, item) => {
            acc[item[0]] = values.some(val => val === item[1]) ? JSON.parse(item[1]) : item[1]
            return acc
        }, {})

    const scope = query.scope ? [...new Set(defaultScope.concat( query.scope.split(',') ))] : defaultScope

    passport.authenticate('google', {
        scope,
        accessType: query.consent ? 'offline' : 'online',
        prompt: query.consent ? 'consent' : 'none',
        session: false,
    })(req, res, next)
})

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user) => {
        
        if (err) return next(err)
        tokenService.createSessionTicket({ userId: user.id }, (err, token) => {
            if (err) next(err)
            else {
                sse.send({ token }, 'authResolve')
                res.sendStatus(201)
            }
        })

    })(req, res, next)
})

router.get('/facebook', (req, res, next) => {

    const defaultScopes = ['public_profile', 'email']

    passport.authenticate('facebook', {
        scope: defaultScopes,
        display: 'popup',
        session: false,
        authType: 'rerequest'
    })(req, res, next)
})

router.get('/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', (err, user) => {

        if (err) return next(err)
        tokenService.createSessionTicket({ userId: user.id }, (err, token) => {
            if (err) next(err)
            else {
                sse.send({ token }, 'authResolve')
                res.sendStatus(201)
            }
        })

    })(req, res, next)
})

router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {

        if (err) return next(err)
        if (!user) return res.status(401).send(info)
        if (!user.email_verified) return res.status(403).send({ name: 'emailVerifiedFails', message: 'Аккаунт не подтвержден' })

        tokenService.createSessionTicket({ userId: user.id }, (err, token) => {
            if (err) next(err)
            else res.status(201).send({ token })
        })
    })(req, res, next)
})

router.post('/logout',
    validationService.refreshTokenValidation(),
    (req, res, next) => {
        const { body } = req
        const { refreshToken, fingerprint } = body

        Session.findOneAndDelete({ refresh_token: refreshToken })
        .then(session => {
            if (!session) throw { status: 401, message: 'Session Expired' }
            if (session.fingerprint !== fingerprint || session.ip !== req.ip) {
                // MUST LOG UNAUTHORIZED LOGOUT
                throw { status: 403, message: 'Invalid Refresh-Token' }
            }
            res.send({ success: true })

        })
        .catch(next)
})

router.post('/refresh-token',
    validationService.refreshTokenValidation(),
    (req, res, next) => {
        const { body } = req
        const { refreshToken, fingerprint } = body

        Session.findOneAndDelete({ refresh_token: refreshToken })
        .then(session => {
            if (!session) throw { status: 401, message: 'Session Expired' }
            if (session.fingerprint !== fingerprint || session.ip !== req.ip) {
                // MUST LOG UNAUTHORIZED LOGOUT
                throw { status: 403, message: 'Invalid Refresh-Token' }
            }
            return Promise.all([
                User.findById(session.user_id),
                tokenService.createRefreshToken()
            ])
        })
        .then(([user, refreshToken]) => {
            const session = Session.create({
                user_id: user.id,
                refresh_token: refreshToken,
                ua: req.get('User-Agent'),
                fingerprint,
                ip: req.ip
            })
            return Promise.all([
                user,
                tokenService.createAccessToken(user),
                session
            ])
        })
        .then(([ user, accessToken, session ]) => {
            res.send({
                user: user.reduce(),
                accessToken,
                refreshToken: session.refresh_token
            })
        })
        .catch(next)
})

router.post('/',
    validationService.createSessionValidation(),
    (req, res, next) => {
        const { body } = req
        const { token, fingerprint } = body

        tokenService.verify(token, { subject: 'session_ticket' })
        .then(token => {
            return Promise.all([
                User.findById(token.userId),
                Session.countDocuments({ user_id: token.userId })
            ])
        })
        .then(([ user, sessionsCount ]) => {
            if (!user) throw { status: 409, message: 'Что-то пошло не так, попробуйте снова' }
            const refreshToken = tokenService.createRefreshToken()

            if (sessionsCount >= MAX_SESSIONS_COUNT) {
                return Promise.all([
                    user,
                    refreshToken,
                    Session.deleteMany({ user_id: user.id })
                ])
            }
            return Promise.all([
                user,
                refreshToken
            ])
        })
        .then(([user, refreshToken]) => {
            const session = Session.create({
                user_id: user.id,
                refresh_token: refreshToken,
                ua: req.get('User-Agent'),
                fingerprint,
                ip: req.ip
            })
            return Promise.all([
                user,
                tokenService.createAccessToken(user),
                session
            ])
        })
        .then(([user, accessToken, session]) => {
            res.send({
                accessToken,
                refreshToken: session.refresh_token,
                user: user.reduce()
            })
        })
        .catch(next)
})

router.post('/register',
    validationService.registerValidation(),
    (req, res, next) => {
        const { body } = req
        const { givenName, familyName, email, password, fingerprint } = body
        
        User.findOne({ email })
        .then(user => {
            if (user) throw { status: 409, message: 'Введенный адрес эл. почты уже связан с другой учетной записью' }
            return User.hashPassword(password)
        })
        .then(hash => {
            return User.create({
                givenName,
                familyName,
                email,
                password: hash,
                email_verified: false
            })
        })
        .then(user => {
            return Promise.all([
                user,
                tokenService.createRefreshToken()
            ])
        })
        .then(([user, refreshToken]) => {
            const session = Session.create({
                user_id: user.id,
                refresh_token: refreshToken,
                ua: req.get('User-Agent'),
                fingerprint,
                ip: req.ip
            })
            return Promise.all([
                user,
                tokenService.createAccessToken(user),
                session
            ])
        })
        .then(([user, accessToken, session]) => {
            return res.status(201).send({
                accessToken,
                refreshToken: session.refresh_token,
                user: user.reduce()
            })
        })
        .catch(next)
})

router.get('/ticket',
    passport.authenticate('jwt', { session: false }),
    authService.adminCheck,
    // validationService.ticketValidation('query'),
    (req, res, next) => {
        const { role, email } = req.query

        User.findOne({ email })
        .then(user => {
            if (user) throw { status: 409, message: 'Нельзя выписать пригласительную ссылку уже зарегистрированному пользователю' }
            return tokenService.createTicketToken({ role, email })
        })
        .then(mailService.sendTicketEmail.bind(mailService, email))
        .then(() => {
            res.send({ success: true })
        })
        .catch(next)
})
// ready
router.get('/send-confirmation-email',
    // validationService.emailValidation('query'),
    (req, res, next) => {
        const { query: { email } } = req
        
        User.findOne({ email })
        .then(user => {
            if (!user) throw { status: 404, message: 'Пользователя с данным адресом эл. почты не существует' }
            if (user.email_verified) throw { status: 403, message: 'Аккаунт этого пользователя уже подтвержден' }

            const token = tokenService.createEmailConfirmToken({ userId: user.id })
            return Promise.all([ token, user])
        })
        .then(mailService.sendConfirmationEmail.bind(mailService))
        .then(() => {
            res.send({ success: true })
        })
        .catch(next)
})
// ready
router.get('/email-confirm', 
    // validationService.tokenValidation('query'),
    (req, res, next) => {
        const { query: { token } } = req

        tokenService.verify( fromBase64(token), {
            subject: 'email_confirm'
        })
        .then(token => {
            if (!token) throw { status: 403, message: 'Срок действия ссылки подтверждения аккаунта истек' }
            return User.findById(token.userId)
        })
        .then(user => {
            if (!user) throw { status: 401, message: 'Не удалось найти пользователя по данной ссылке' }
            if (user.email_verified) return Promise.resolve(user)
            user.email_verified = true
            return Promise.all([
                tokenService.createSessionTicket({ userId: user.id }),
                user.save()
            ])
        })
        .then(([ token ]) => {
            res.send({ token })
        })
        .catch(next)
})
// ready
router.get('/password-reset-email', 
    // validationService.emailValidation('query'),
    (req, res, next) => {
        const { query: { email } } = req

        User.findOne({ email })
        .then(user => {
            if (!user) throw { status: 404, message: 'Пользователя с данным адресом эл. почты не существует' }
            const token = tokenService.createPasswordResetToken({ userId: user.id })
            return Promise.all([ token, user])
        })
        .then(mailService.sendPasswordResetEmail.bind(mailService))
        .then(() => {
            res.send({ success: true })
        })
        .catch(next)
})

// ready
router.post('/change-password',
    validationService.changePasswordValidation(),
    (req, res, next) => {
        const { body: { token, newPassword } } = req
        
        tokenService.verify( fromBase64(token), {
            subject: 'password_reset'
        })
        .then(token => {
            if (!token) throw { status: 403, message: 'Срок действия ссылки подтверждения аккаунта истек' }
            return User.findById(token.userId)
        })
        .then(user => {
            if (!user) throw { status: 401, message: 'Не удалось найти пользователя по данной ссылке' }
            const hash = User.hashPassword(newPassword)
            return Promise.all([ user, hash ])
        })
        .then(([ user, hash ]) => {
            if (!hash) throw { status: 500, message: 'Ошибка при хэшировании пароля' }
            user.password = hash
            return user.save()
        })
        .then(() => {
            res.send({ success: true })
        })
        .catch(next)
})

module.exports = router