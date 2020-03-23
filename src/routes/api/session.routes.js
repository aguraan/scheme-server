const router = require('express').Router()
const Session = require('../../models/session.model')


router.get('/:userId', (req, res, next) => {

    Session.find({ user_id: req.params.userId})
    .then(sessions => {

        if (!sessions.length) throw { status: 404, message: 'Not Found' }
        res.send({ sessions: sessions.map(session => session.reduce()) })
    })
    .catch(next)
})

router.delete('/:sessionId',
    (req, res, next) => {

    Session.findByIdAndDelete(req.params.sessionId)
    .then(session => {
        
        if (!session) throw { status: 404, message: 'Not Found'}
        res.send({ success: true })
    })
    .catch(next)
})

module.exports = router