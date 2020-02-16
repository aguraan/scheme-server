const mongoose = require('mongoose')

const FacebookSchema = new mongoose.Schema({
    facebook_id: String,
    scope: [{ type: String }],
    emails: [{
        value: String,
        verified: {
            type: Boolean,
            default: false
        }
    }],
    accessToken: String,
    refreshToken: String
})

module.exports = mongoose.model('FacebookAccount', FacebookSchema)