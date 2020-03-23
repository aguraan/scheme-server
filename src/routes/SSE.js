const SSE = require('express-sse')
const sse = new SSE(['Connected']) // ["array", "containing", "initial", "content", "(optional)"]

module.exports = sse