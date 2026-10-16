/**
 * An error we throw on purpose, with the HTTP status code to send back.
 * Example: throw new AppError(404, "Interview report not found.")
 * The error-handling middleware (middlewares/error.middleware.js) turns it into a JSON response.
 */
class AppError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.name = "AppError"
        this.statusCode = statusCode
    }
}

module.exports = AppError
