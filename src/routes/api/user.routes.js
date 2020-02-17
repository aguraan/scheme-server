const router = require('express').Router()
const User = require('../../models/user.model')
const { validationService } = require('../../services')

router.get('/', (req, res, next) => {

    User.find()
    .then(users => {
        res.send({ users })
    })
    .catch(next)
})

router.get('/:id', (req, res, next) => {

    if (req.params.id === req.user.id) {
        return res.send({ user: req.user.reduce() })
    }

    User.findById(req.params.id)
    .then(user => {
        if (!user) throw { status: 404, message: 'Not Found' }
        res.send({ user: user.reduce() })
    })
    .catch(next)
})

router.patch('/:id',
    validationService.validate('userUpdate'),
    (req, res, next) => {

        User.findByIdAndUpdate(req.params.id, req.body.userUpdate, { new: true })
        .then(user => {
            if (!user) throw { status: 404, message: 'Not Found'}
            res.status(201).send({ user: user.reduce() })
        })
        .catch(next)
    }
)

router.delete('/:id', (req, res, next) => {
        
    User.findByIdAndDelete(req.params.id)
    .then(user => {
        if (!user) throw { status: 404, message: 'Not Found' }
        res.send({ success: true })
    })
    .catch(next)
})

module.exports = router