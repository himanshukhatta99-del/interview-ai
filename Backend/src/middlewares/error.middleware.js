const AppError = require("../utils/AppError")

/**
 * Runs for any request that matched no route.
 */
function notFoundHandler(req, res) {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

/**
 * Central error handler. Express 5 forwards errors thrown inside async controllers here
 * automatically, so controllers don't need their own try/catch for unexpected errors.
 * Must have 4 parameters so Express recognises it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    // Errors we threw on purpose
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message })
    }

    // multer (file upload) errors
    if (err.name === "MulterError") {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "File is too large. Maximum size is 3MB."
            : "File upload failed."
        return res.status(400).json({ message })
    }

    // Malformed JSON body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body is not valid JSON." })
    }

    // Mongo duplicate key (e.g. two people registering the same email at the same moment)
    if (err.code === 11000) {
        return res.status(409).json({ message: "Account already exists with this email address or username" })
    }

    // Anything else is a bug or an outage: log the details, hide them from the client.
    console.error(err)
    res.status(500).json({ message: "Something went wrong on our side. Please try again." })
}

module.exports = { notFoundHandler, errorHandler }
