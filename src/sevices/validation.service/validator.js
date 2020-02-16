// const { isArray, isString } = require('util')
const Joi = require('@hapi/joi')
const { schemes } = require('./schemes')

const makeScheme = (...keyArray) => {
    const scheme = keyArray.reduce((acc, prop) => {
        if (prop in schemes) {
            acc[prop] = schemes[prop]
            return acc
        }
        else throw { status: 500, message: `Validator failed. No such property "${ prop }"` }
    }, {})
    return Joi.object(scheme)
}

const validate = (...fields) => {
    return (req, res, next) => {
        makeScheme(...fields).validateAsync(req.body)
            .then(() => next())
            .catch(next)
    }
}

module.exports = { validate, makeScheme }