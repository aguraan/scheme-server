const router = require('express').Router()
const { authService } = require('../../services')

const userRoutes = require('./user.routes')
const accountRoutes = require('./account.routes')
const sessionRoutes = require('./session.routes')

router.use('/users', authService.adminCheck, userRoutes)
router.use('/accounts', authService.adminCheck, accountRoutes)
router.use('/sessions', authService.userCheck, sessionRoutes)

module.exports = router