const { makeScheme } = require('./validator')

const authValidation = {

    registerValidation() {
        return (req, res, next) => {
            makeScheme('givenName', 'familyName', 'email', 'password', 'fingerprint').validateAsync(req.body)
            .then(() => next())
            .catch(next)
        }
    },

    refreshTokenValidation() {
        return (req, res, next) => {
            makeScheme('refreshToken', 'fingerprint').validateAsync(req.body)
            .then(() => next())
            .catch(next)
        }
    },
    
    // emailValidation(data) {
    //     return (req, res, next) => {
    //         makeScheme('email').validateAsync(req[data])
    //         .then(() => next())
    //         .catch(next)
    //     }
    // },

    // tokenValidation(data) {
    //     return (req, res, next) => {
    //         makeScheme('token').validateAsync(req[data])
    //         .then(() => next())
    //         .catch(next)
    //     }
    // },
    
    changePasswordValidation() {
        return (req, res, next) => {
            makeScheme('token', 'newPassword').validateAsync(req.body)
            .then(() => next())
            .catch(next)
        }
    },

    createSessionValidation() {
        return (req, res, next) => {
            makeScheme('token', 'fingerprint').validateAsync(req.body)
            .then(() => next())
            .catch(next)
        }
    },

    // ticketValidation(data) {
    //     return (req, res, next) => {
    //         makeScheme('role', 'email').validateAsync(req[data])
    //         .then(() => next())
    //         .catch(next)
    //     }
    // },

    // googleAuthValidation(data) {
    //     return (req, res, next) => {
    //         makeScheme('scope', 'consent').validateAsync(req[data])
    //         .then(() => next())
    //         .catch(next)
    //     }
    // }
}

module.exports = authValidation