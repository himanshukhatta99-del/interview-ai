/**
 * Small, dependency-free input validators.
 * Each function returns an error message (string) or null when the input is valid.
 *
 * Why check `typeof === "string"`? Without it, a client could send
 * { "email": { "$gt": "" } } and Mongo would treat it as a query operator (NoSQL injection).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/

const LIMITS = {
    jobDescription: 5000,
    selfDescription: 3000,
}

function validateRegisterInput({ username, email, password } = {}) {
    if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
        return "Please provide username, email and password"
    }
    if (username.trim().length < 3 || username.trim().length > 30 || !USERNAME_REGEX.test(username.trim())) {
        return "Username must be 3-30 characters (letters, numbers, dot, dash or underscore)"
    }
    if (!EMAIL_REGEX.test(email.trim())) {
        return "Please enter a valid email address"
    }
    if (password.length < 8 || password.length > 72) {
        // bcrypt only uses the first 72 bytes of a password, so we cap the length.
        return "Password must be between 8 and 72 characters"
    }
    return null
}

function validateLoginInput({ email, password } = {}) {
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
        return "Please provide email and password"
    }
    return null
}

function validateReportInput({ jobDescription, selfDescription } = {}, hasResumeFile) {
    if (typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
        return "Please paste a job description (at least 20 characters)"
    }
    if (jobDescription.length > LIMITS.jobDescription) {
        return `Job description must be at most ${LIMITS.jobDescription} characters`
    }
    if (selfDescription !== undefined && typeof selfDescription !== "string") {
        return "Self description must be text"
    }
    if (selfDescription && selfDescription.length > LIMITS.selfDescription) {
        return `Self description must be at most ${LIMITS.selfDescription} characters`
    }
    if (!hasResumeFile && !(selfDescription && selfDescription.trim())) {
        return "Please upload a resume (PDF) or write a short self description"
    }
    return null
}

module.exports = { validateRegisterInput, validateLoginInput, validateReportInput, LIMITS }
