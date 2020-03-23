const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const { join } = require('path')
const routerLogger = require('./src/helpers/routerLogger')
const errorHandler = require('./src/helpers/errorHandler')
const passport = require('./src/passport.config')
const helmet = require('helmet')
// const socials = require('./src/socials')
// const session = require('express-session')
// const MongoStore = require('connect-mongo')(session)
// const cookieParser = require('cookie-parser')

const { 
    DB_CONNECT, 
    PROTOCOL, 
    HOSTNAME, 
    PORT, 
    // SESSION_SECRET
} = require('./config')

const app = express()
const index = join(__dirname, 'dist')
const isProduction = process.env.NODE_ENV === 'production'

app.set('trust proxy', isProduction)

// App Middleware

app.use(helmet())
app.use(cors())

!isProduction && app.use(morgan('combined'))
!isProduction && app.use(routerLogger())

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// app.use(cookieParser())
// app.use(session({
//     store: new MongoStore({
//         url: DB_CONNECT
//     }),
//     cookie: {
//         secure: false, // turn to "true" on production
//         httpOnly: true,
//         maxAge: 24*60*60*1000 // 24 hours
//     },
//     secret: SESSION_SECRET,
//     saveUninitialized: false,
//     resave: false,
// }))
app.use(passport.initialize())
// app.use(socials())
// app.use(passport.session())
app.use(express.static( index ))

// Routes

app.use('/', require('./src/routes'))

// Error handler
app.use(errorHandler())
app.use('*', (req, res) => {
    res.sendFile( index )
})

// Connect to DataBase
mongoose.Promise = global.Promise
mongoose.connect(DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})
mongoose.connection.once('open', console.log.bind(console, '  MongoDB Connection Succeeded'))
mongoose.connection.on('error', console.error.bind(console, '  Connection Error'))

app.listen(PORT, HOSTNAME, () => {
    console.log(`\n  Server running at:\n  - Local:  \x1b[36m${PROTOCOL}://${HOSTNAME}:\x1b[0m\x1b[96m${PORT}\x1b[0m\x1b[36m/\x1b[0m`)
})
