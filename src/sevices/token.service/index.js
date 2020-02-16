const jwt = require('jsonwebtoken')
const { pipe, fromBase64 } = require('../../helpers')
const {
    JWT_SECRET,
    EMAIL_CONFIRMATION_TOKEN_LIFE,
    PASSWORD_RESET_TOKEN_LIFE,
    SESSION_TICKET_LIFE,
    ACCESS_TOKEN_LIFE,
    TICKET_TOKEN_LIFE
} = require('../../../config')
const { isFunction } = require('util')
const { makeScheme } = require('../validation.service')
const crypto = require('crypto')

const tokenService = {

    create(...args) {
        args.splice(1, 0, JWT_SECRET)
        const sign = jwt.sign.bind(jwt, ...args)
        if (isFunction(args[args.length-1])) {
            sign()
        } else {
            return new Promise((resolve, reject) => {
                sign((err, token) => {
                    if (err) reject(err)
                    else resolve(token)
                })
            })
        }
    },

    verify(...args) {
        args.splice(1, 0, JWT_SECRET)
        const verify = jwt.verify.bind(jwt, ...args)
        if (isFunction(args[args.length-1])) {
            verify()
        } else {
            return new Promise((resolve, reject) => {
                verify((err, token) => {
                    if (err) reject(err)
                    else resolve(token)
                })
            })
        }
    },

    extractClaims(token) {
        const payload = token.split('.')[1]
        return pipe(fromBase64, JSON.parse)(payload)
    },

    createSessionTicket(data, cb) {
        const promise = makeScheme('userId').validateAsync(data)
        const create = this.create.bind(this, data, {
            subject: 'session_ticket',
            expiresIn: SESSION_TICKET_LIFE
        })
        if (isFunction(cb)) {
            promise.then(() => {
                create(cb)
            }).catch(cb)
        } else return promise.then(() => create())
    },

    createEmailConfirmToken(data, cb) {
        const promise = makeScheme('userId').validateAsync(data)
        const create = this.create.bind(this, data, {
            subject: 'email_confirm',
            expiresIn: EMAIL_CONFIRMATION_TOKEN_LIFE
        })
        if (isFunction(cb)) {
            promise.then(() => {
                create(cb)
            }).catch(cb)
        } else return promise.then(() => create()) 
    },

    createPasswordResetToken(data, cb) {
        const promise = makeScheme('userId').validateAsync(data)
        const create = this.create.bind(this, data, {
            subject: 'password_reset',
            expiresIn: PASSWORD_RESET_TOKEN_LIFE
        })
        if (isFunction(cb)) {
            promise.then(() => {
                create(cb)
            }).catch(cb)
        } else return promise.then(() => create()) 
    },

    createAccessToken(data, cb) {
        const promise = makeScheme('role', '_id').unknown().validateAsync(data)
        const create = this.create.bind(this, {
            role: data.role,
            userId: data._id
        }, {
            expiresIn: ACCESS_TOKEN_LIFE
        })
        if (isFunction(cb)) {
            promise.then(() => {
                create(cb)
            }).catch(cb)
        } else return promise.then(() => create()) 
    },

    createRefreshToken(cb) { // TODO: Пересмотреть устройство токена
        if (isFunction(cb)) {
            crypto.randomBytes(32, (err, hash) => {
                if (err) cb(err)
                else {
                    const refreshToken = hash.toString('hex')
                    cb(null, refreshToken)
                }
            })
        } else {
            return new Promise((resolve, reject) => {
                crypto.randomBytes(32, (err, hash) => {
                    if (err) reject(err)
                    else {
                        const refreshToken = hash.toString('hex')
                        resolve(refreshToken)
                    }
                })
            })
        }
    },

    createTicketToken(data, cb) {
        const promise = makeScheme('role', 'email').validateAsync(data)
        const create = this.create.bind(this, { role: data.role }, {
            subject: data.email,
            expiresIn: TICKET_TOKEN_LIFE
        })
        if (isFunction(cb)) {
            promise.then(() => {
                create(cb)
            }).catch(cb)
        } else return promise.then(() => create())
    }

}

module.exports = tokenService