module.exports = () => {
    const colors = {
        GET: 2,
        POST: 6,
        PUT: 3,
        DELETE: 5,
        PATCH: 7
    }
    return (req, res, next) => {
        const { method, url } = req
        
        console.log(`\n\x1b[4${colors[method]}m\x1b[30m ${method} \x1b[0m`, `\x1b[3${colors[method]}m${url}\x1b[0m`)
        next()
    }
}