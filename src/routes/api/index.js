const router = require('express').Router()
const { authService } = require('../../services')

const userRoutes = require('./user.routes')
const accountRoutes = require('./account.routes')

router.use('/users', authService.adminCheck, userRoutes)
router.use('/accounts', authService.adminCheck, accountRoutes)

module.exports = router