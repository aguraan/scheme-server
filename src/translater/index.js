const fs = require('fs')
const { isFunction } = require('util')
const { createHash } = require('crypto')

module.exports = (lang, phrase, cb) => {
    const isCallback = isFunction(cb)
    
    fs.readFile('./src/translater/lib.json', 'utf8', (err, file) => {
        if (err) return isCallback ? cb(err) : Promise.reject(err)

        const lib = JSON.parse(file)
        let locale = lib[lang]
        const hash = createHash('sha256').update(phrase).digest('hex')
        const translated = Object.keys(locale).includes(hash)
        if (translated) {
            return isCallback ? cb(null, locale[hash]) : Promise.resolve(locale[hash])
        } else {
            locale = Object.assign(locale, { [hash]: phrase })
            const json = JSON.stringify(lib)
            fs.writeFile('./src/translater/lib.json', json, err => {
                if (err) return isCallback ? cb(err) : Promise.reject(err)
                return isCallback ? cb(null, phrase) : Promise.resolve(phrase)
            })
        }
    })
}