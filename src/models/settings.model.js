const mongoose = require('mongoose')

const SettingsSchema = new mongoose.Schema({
    dark: {
        type: Boolean,
        default: false
    },
    theme: {
        type: Number,
        default: 0
    },
    companyTableSettings: {
        displayHeaders: [{ type: Number }]
    }
})

module.exports = mongoose.model('Settings', SettingsSchema)