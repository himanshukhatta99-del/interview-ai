/**
 * Turns an axios error into a short message a user can understand.
 * 1. The server answered with an error -> show the server's message (e.g. "Invalid email or password")
 * 2. The server never answered (offline / server down) -> say so
 * 3. Anything else -> use the fallback text
 */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    const serverMessage = error?.response?.data?.message
    if (typeof serverMessage === "string" && serverMessage) {
        return serverMessage
    }
    if (error?.request && !error.response) {
        return "Cannot reach the server. Check your connection and try again."
    }
    return fallback
}
