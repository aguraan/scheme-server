module.exports = () => (err, req, res, next) => {

    const { status, message, details } = err

    if (status && message) return res.status(status).send(err)

    if (details) return res.status(400).send(details[0])
    
    return res.status(500).send(err)
}