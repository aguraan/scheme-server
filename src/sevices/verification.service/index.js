const verifySession = (session, fingerprint) => {
    return session.fingerprint !== fingerprint
}

module.exports = {
    verifySession
}