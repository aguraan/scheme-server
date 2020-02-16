const fs = require('fs')
const { camelize } = require('../helpers')
const foldersNames = fs.readdirSync( module.path )
const services = foldersNames
    .filter(name => name.includes('.service'))
    .reduce((acc, serviceName) => {
        const ccProp = serviceName.split('.').reduce(camelize)
        acc[ccProp] = require(`./${ serviceName }`)
        return acc
    }, {})

module.exports = services
// {
//     mailService: require('./mail.service'),
//     tokenService: require('./token.service'),
//     validationService: require('./validation.service'),
//     verificationService: require('./verification.service')
// }