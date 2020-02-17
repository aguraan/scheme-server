const { role } = require('../../../config')

const authService = {

    adminCheck(req, res, next) {
        if (req.user && req.user.role === role.ADMIN) next()
        else res.status(403).end()
    },

    fighterCheck(req, res, next) {
        if (req.user && (
            req.user.role === role.FIGHTER ||
            req.user.role === role.ADMIN
        )) next()
        else res.status(403).end()
    },

    userCheck(req, res, next) {
        if (req.user && (
            req.user.role === role.USER ||
            req.user.role === role.ADMIN
        )) next()
        else res.status(403).end()
    },

    guestCheck(req, res, next) {
        if (req.user && (
            req.user.role === role.GUEST ||
            req.user.role === role.ADMIN
        )) next()
        else res.status(403).end()
    }

}

module.exports = authService