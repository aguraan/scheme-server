const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth2').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const User = require('./models/user.model')
const GoogleAccount = require('./models/google.model')
const FacebookAccount = require('./models/facebook.model')
// const { capitalize } = require('./helpers')
const { google, facebook, JWT_SECRET } = require('../config')

passport.serializeUser((user, cb) => {
    cb(null, user.id)
})

passport.deserializeUser((id, cb) => {
    User.findById(id, (err, user) => {
        if (err) return cb(err)
        cb(null, user)
    })
})

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    (email, password, cb) => {
        const info = {
            name: 'credentialsFails',
            message: 'Неправильный адрес электронной почты или пароль'
        }
        process.nextTick(() => {
            User.findOne({ email })
            .then(user => {
                if (!user || !user.password) cb(null, false, info)
                else {
                    user.comparePassword(password, (err, valid) => {
                        if (err) cb(err, false)
                        else if (!valid) cb(null, false, info)
                        else cb(null, user)
                    })
                }
            })
            .catch(cb)
        })
    }
))

passport.use(new GoogleStrategy({
    clientID: google.client_id,
    clientSecret: google.client_secret,
    callbackURL: google.redirect_uris[0],
    passReqToCallback: true,
},
(req, accessToken, refreshToken, params, profile, cb) => {
    const { id, displayName, name, emails, email, email_verified, picture } = profile
    process.nextTick(() => {
        GoogleAccount.findOne({ google_id: id })
            .then(account => {
                const user = User.findOne({ email })
                if (account) {

                    account.accessToken = accessToken
                    account.scope = [ ...new Set([ ...account.scope, ...params.scope.split(' ') ])]
                    if (refreshToken) account.refreshToken = refreshToken
                    return Promise.all([ user, account.save() ])

                } else {

                    const googleAccount = GoogleAccount.create({
                        google_id: id,
                        scope: params.scope.split(' '),
                        emails,
                        accessToken,
                        refreshToken
                    })
                    return Promise.all([ user, googleAccount ])
                }
            })
            .then(([ user, account ]) => {
                if (user) {

                    user.google_id = account.google_id
                    if (!user.picture) user.picture = picture
                    return Promise.resolve(user.save())

                } else {

                    return User.create({
                        google_id: id,
                        username: displayName,
                        givenName: name.givenName,
                        familyName: name.familyName,
                        middleName: name.middleName,
                        picture: picture,
                        email: email,
                        email_verified: email_verified
                    })
                }
            })
            .then(user => {
                cb(null, user)
            })
            .catch(cb)
    })
}))

passport.use(new FacebookStrategy({
    clientID: facebook.client_id,
    clientSecret: facebook.client_secret,
    callbackURL: facebook.redirect_uris[0],
    profileFields: ['id', 'displayName', 'email', 'picture', 'name'],
},
(accessToken, refreshToken, profile, cb) => {
    const { id, displayName, name, emails, _json, username } = profile
    process.nextTick(() => {
        FacebookAccount.findOne({ facebook_id: id })
            .then(account => {
                const user = User.findOne({ email: _json.email })
                if (account) {

                    account.accessToken = accessToken
                    if (refreshToken) account.refreshToken = refreshToken
                    return Promise.all([ user, account.save() ])

                } else {

                    const facebookAccount = FacebookAccount.create({
                        facebook_id: id,
                        emails,
                        accessToken,
                        refreshToken
                    })
                    return Promise.all([ user, facebookAccount ])
                }
            })
            .then(([ user, account ]) => {
                if (user) {

                    user.facebook_id = account.facebook_id
                    if (!user.picture) user.picture = _json.picture.data.url
                    return Promise.resolve(user.save())

                } else {

                    return User.create({
                        facebook_id: id,
                        username: username || displayName,
                        givenName: name.givenName,
                        familyName: name.familyName,
                        middleName: name.middleName,
                        picture: _json.picture.data.url,
                        email: _json.email,
                        email_verified: false
                    })
                }
            })
            .then(user => {
                cb(null, user)
            })
            .catch(cb)
    })
}))

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
},
(jwtPayload, cb) => {
    const { userId } = jwtPayload
    process.nextTick(() => {
        User.findById(userId)
        .then(user => {
            if (user) cb(null, user)
            else cb(null, false)
        })
        .catch(cb)
    })
}))

module.exports = passport