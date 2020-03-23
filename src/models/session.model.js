const mongoose = require('mongoose')
const ms = require('ms')
const { SESSION_LIFE } = require('../../config')

const SessionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    },
    ua: {
        type: String,
        required: true
    },
    fingerprint: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    geolocation: {
        country: String,
        city: String
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
        expires: ms(SESSION_LIFE) / 1000
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
})

SessionSchema.methods.reduce = function() {
    const { _id, user_id, ua, ip, createdAt, updatedAt, fingerprint, geolocation, refresh_token } = this
    return { _id, user_id, ua, ip, createdAt, updatedAt, fingerprint, geolocation, refresh_token }
}

module.exports = mongoose.model('Session', SessionSchema)