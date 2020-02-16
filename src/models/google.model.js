const mongoose = require('mongoose')

const GoogleSchema = new mongoose.Schema({
    google_id: String,
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

module.exports = mongoose.model('GoogleAccount', GoogleSchema)