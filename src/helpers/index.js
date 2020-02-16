const pipe = (...fns) => x => fns.reduce((x, f) => f(x), x)
const capitalize = str => {
    if (typeof str !== 'string') throw new Error('Argument must be a string!')
    return str[0].toUpperCase() + str.slice(1)
}
const toBase64 = str => Buffer.from(str).toString('base64')
const fromBase64 = str => Buffer.from(str, 'base64').toString('ascii')
const camelize = (part1, part2) => `${ part1 }${ capitalize(part2) }`

module.exports = {
    pipe,
    capitalize,
    toBase64,
    fromBase64,
    camelize
}