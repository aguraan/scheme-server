const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { isFunction } = require('util')
const { role } = require('../../config')

const UserSchema = new mongoose.Schema({
    role: {
        type: String,
        default: role.GUEST
    },
    username: String,
    givenName: String,
    familyName: String,
    middleName: String,
    picture: String,
    email: {
        type: String,
        unique: true,
        match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        required: true
    },
    email_verified: Boolean,
    password: {
        type: String
    },
    google_id: String,
    facebook_id: String,
    settings: {
        dark: {
            type: Boolean,
            default: false
        },
        theme: {
            type: Number,
            default: 0
        },
        companyTableSettings: {
            displayHeaders: {
                type: [{ type: Number }],
                default: () => null
            }
        }
    },
    created: {
        type: Date,
        default: Date.now
    }
})

UserSchema.statics.hashPassword = (password, cb) => {
    if (isFunction(cb)) return bcrypt.hash(password, 10, cb)
    return bcrypt.hash(password, 10)
}

UserSchema.methods.comparePassword = function(password, cb) {
    if (isFunction(cb)) return bcrypt.compare(password, this.password, cb)
    return bcrypt.compare(password, this.password)
}

UserSchema.methods.reduce = function() {
    const { _id, role, username, name, givenName, google_id, settings,
        facebook_id, familyName, middleName, picture, email, created
    } = this
    return { _id, role, username, name, givenName, google_id, settings,
        facebook_id, familyName, middleName, picture, email, created
    }
}

UserSchema.virtual('name')
    .get(function() {
        const { givenName, familyName } = this
        if (givenName && familyName) return `${ familyName } ${ givenName }`
    })
    .set(function(val) {
        const [ familyName, givenName ] = val.split(' ')
        this.set({ familyName, givenName })
    })

module.exports = mongoose.model('User', UserSchema)