const nodemailer = require('nodemailer')
const { toBase64 } = require('../../helpers')
const handlebars = require('handlebars')
const {
    PROTOCOL,
    HOSTNAME,
    PORT,
    EMAIL_ADMIN,
    EMAIL_NAME,
    EMAIL_ADDRESS,
    google
} = require('../../../config')
const htmlTemplates = require('../../htmlTemplates')
const { URL } = require('url')
const GoogleAccount = require('../../models/google.model')

    
const mailService = {

    get baseURL() {
        return `${ PROTOCOL }://${ HOSTNAME }:${ PORT }`
    },

    transporter() {
        return GoogleAccount.findOne({ google_id: google.id })
        .then(account => {
            return nodemailer.createTransport({ 
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    type: 'OAuth2',
                    user: EMAIL_ADMIN,
                    clientId: google.client_id,
                    clientSecret: google.client_secret,
                    refreshToken: account.refreshToken,
                    accessToken: account.accessToken
                }
            })
        })
    },

    sendMail({ to, subject, html }) {
        return this.transporter()
        .then(transport => {
            return transport.sendMail({
                from: `"${EMAIL_NAME}" ${EMAIL_ADDRESS}`,
                generateTextFromHTML: true, 
                to, subject, html
            })
        })
    },

    sendConfirmationEmail([token, user]) {
        return htmlTemplates.readFile('emailConfirm.html')
            .then(file => {
                const htmlInput = {
                    href: new URL(`/login?confirmation=${ toBase64(token) }`, this.baseURL).href,
                    year: new Date().getFullYear(),
                    name: user.name || user.username || ''
                }
                const template = handlebars.compile(file)
                return this.sendMail({
                    to: user.email,
                    subject: 'Подтвердите Ваш Аккаунт',
                    html: template(htmlInput)
                })
            })
    },

    sendPasswordResetEmail([token, user]) {
        return htmlTemplates.readFile('passwordReset.html')
            .then(file => {
                const htmlInput = {
                    href: new URL(`/login?resetToken=${ toBase64(token) }`, this.baseURL).href,
                    year: new Date().getFullYear(),
                    name: user.name || user.username || ''
                }
                const template = handlebars.compile(file)
                return this.sendMail({
                    to: user.email,
                    subject: 'Сброс пароля',
                    html: template(htmlInput)
                })
            })
    },

    sendTicketEmail(email, token) {
        return htmlTemplates.readFile('invitationTicket.html')
            .then(file => {
                const htmlInput = {
                    href: new URL(`/login?ticket=${ toBase64(token) }`, this.baseURL).href,
                    year: new Date().getUTCFullYear()
                }
                const template = handlebars.compile(file)
                return this.sendMail({
                    to: email,
                    subject: 'Регистрация',
                    html: template(htmlInput)
                })
            })
    }
}


module.exports = mailService