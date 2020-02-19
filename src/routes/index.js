const router = require('express').Router()
const sse = require('./SSE')
const passport = require('passport')

const authRoutes = require('./auth')
const apiRoutes = require('./api')

router.get('/stream', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    res.setHeader('Access-Control-Allow-Credentials', true)
    next()
}, sse.init)

router.use('/auth', authRoutes)
router.use('/api',
    passport.authenticate('jwt', { session: false }),
    apiRoutes
)

module.exports = router