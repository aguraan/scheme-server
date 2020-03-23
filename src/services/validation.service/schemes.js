const Joi = require('@hapi/joi')
const { ObjectId } = require('mongoose').Types

const userScheme = {
    google_id: Joi.string(),
    facebook_id: Joi.string(),
    role: Joi.string().pattern(/^ADMIN$|^USER$|^GUEST$|^FIGHTER$/),
    username: Joi.string(),
    givenName: Joi.string(),
    familyName: Joi.string(),
    middleName: Joi.string(),
    picture: Joi.string(),
    email: Joi.string().email(),
    email_verified: Joi.boolean(),
    password: Joi.string(),
    settings: Joi.object({
        dark: Joi.boolean(),
        theme: Joi.number(),
        companyTableSettings: Joi.object({
            displayHeaders: Joi.array().items(Joi.number().integer())
        })
    })
}

const googleScheme = {
    scope: Joi.array().items(Joi.string()),
    emails: Joi.array().items(Joi.object({ value: Joi.string(), verified: Joi.boolean() })),
    accessToken: Joi.string(),
    refreshToken: Joi.string()
}

const schemes = {
    get refreshToken() {
        return this.token
    },
    get newPassword() {
        return this.password
    },
    get id() {
        return this.userId
    },
    _id: Joi.object().instance(ObjectId).required(),
    userId: Joi.string().required(),
    email: Joi.string().email().required(),
    givenName: Joi.string().max(32).required(),
    familyName: Joi.string().max(32).required(),
    password: Joi.string().min(6).max(256).required(),
    fingerprint: Joi.string().required(),
    token: Joi.string().required(),
    role: Joi.string().pattern(/^ADMIN$|^USER$|^GUEST$|^FIGHTER$/).required(),
    scope: Joi.string(),
    consent: Joi.boolean(),
    provider: Joi.string(),
    userUpdate: Joi.object(userScheme).required(),
    googleUpdate: Joi.object(googleScheme).required(),
}

module.exports = { schemes }