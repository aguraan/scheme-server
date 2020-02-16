const fs = require('fs').promises
const { join } = require('path')

module.exports = {
    readFile(fileName) {
        return fs.readFile( join(__dirname, fileName), 'utf8')
    }
}