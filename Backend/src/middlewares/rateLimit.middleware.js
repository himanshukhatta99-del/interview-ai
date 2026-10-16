const rateLimit = require("express-rate-limit")

const tooMany = (message) => ({ message })

// Protects login/register from password guessing.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooMany("Too many attempts. Please try again in a few minutes.")
})

// Every AI call costs money / API quota, so limit them per IP.
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooMany("You have reached the hourly limit for AI requests. Please try again later.")
})

module.exports = { authLimiter, aiLimiter }
