const router = require('express').Router()
const GoogleAccount = require('../../models/google.model')
const { validationService } = require('../../services')

router.get('/google', (req, res, next) => {

    GoogleAccount.find()
    .then(accounts => {
        res.send({ accounts })
    })
    .catch(next)
})

router.get('/google/:id', (req, res, next) => {

    GoogleAccount.findOne({ google_id: req.params.id })
    .then(account => {

        if (!account) throw { status: 404, message: 'Not Found' }
        res.send({ account })
    })
    .catch(next)
})

router.patch('/google/:id',
    validationService.validate('googleUpdate'),
    (req, res, next) => {

    GoogleAccount.findOneAndUpdate({ google_id: req.params.id }, req.body.googleUpdate, { new: true })
    .then(account => {
        
        if (!account) throw { status: 404, message: 'Not Found'}
        res.status(201).send({ account })
    })
    .catch(next)
})

module.exports = router