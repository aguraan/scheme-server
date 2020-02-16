const User = require('./models/user.model')
const GoogleAccount = require('./models/google.model')
const { google, facebook } = require('../config')
const Request = require('request-promise-native')
const { URLSearchParams } = require('url')
const jwt = require('jsonwebtoken')

socials.use({
    type: 'google',
    clientID: google.client_id,
    clientSecret: google.client_secret,
    callbackURL: google.redirect_uris[0],
    authorizationURL: google.auth_uri,
    tokenURL: google.token_uri,
    scope: ['profile', 'email', 'openid'],
},
(accessToken, refreshToken, profile, cb) => {
    console.log({ accessToken, refreshToken })
    const { id, displayName, name, emails, picture, email, email_verified } = profile
    process.nextTick(() => {
        GoogleAccount.findOne({ google_id: id })
            .then(account => {
                const user = User.findOne({ email: _json.email })
                if (account) {

                    account.accessToken = accessToken
                    if (refreshToken) account.refreshToken = refreshToken
                    return Promise.all([ user, account ])

                } else {

                    const googleAccount = GoogleAccount.create({
                        google_id: id,
                        scope: req.query.scope.split(' '),
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
                    return user.save()

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
})

socials.authenticate = function(provider, options = {}) {
        
    return (req, res, next) => {
        console.log({
            query: req.query,
            headers: req.headers
        })

        const isValidQuery = req.query.state === 'some_unique_value'

        if (isValidQuery) {
            this.authenticateGoogle(req.query)
            .then(response => {
                console.log({ response })
                const result = JSON.parse(response)
                console.log({ result })
                const { access_token, id_token } = result

                Request.get(google.auth_provider_x509_cert_url)
                .then(file => {
                    const certs = JSON.parse(file)
                    const certsEntries = Object.entries(certs)

                    jwt.verify(id_token, certsEntries[0][1], {
                        audience: google.client_id,
                        issuer: ['accounts.google.com', 'https://accounts.google.com']
                    }, (err, decoded) => {
                        if (err) console.log(err)
                        const id = decoded.sub
                        const email = decoded.email
                        const email_verified = decoded.email_verified
                        const name = decoded.name
                        const given_name = decoded.given_name
                        const picture = decoded.picture
                        
                    })
                })
                res.send(result)
            })
            .catch(error => {
                console.error({ error })
                res.send(error)
            })
        } else {
            res.send({ href: this.googleHref })
        }
    }
}

socials.use = function(options, cb) {
    
}


const other = {

    get googleHref() {
        const qs = new URLSearchParams({
            client_id: google.client_id,
            redirect_uri: google.redirect_uris[0],
            response_type: 'code',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
                'openid', 'profile', 'email',
                'https://mail.google.com/'
            ].join(' '),
            access_type: 'offline',
            include_granted_scopes: true,
            state: 'some_unique_value',
            prompt: 'consent',
            authType: 'rerequest',
            accessType: 'offline',
        })
        return `${ google.auth_uri }?${ qs }`
    },

    authenticateGoogle(query) {
        return Request.post(google.token_uri, {
            form: {
                code: query.code,
                client_id: google.client_id,
                client_secret: google.client_secret,
                redirect_uri: google.redirect_uris[0],
                grant_type: 'authorization_code'
            }
        })
    },
}

function socials() {
    return (req, res, next) => {
        next()
    }
}

module.exports = socials