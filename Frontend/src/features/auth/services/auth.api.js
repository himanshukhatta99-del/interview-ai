import api from "../../../api/client.js"

// These functions let errors propagate (no try/catch here).
// The caller (a page or hook) decides what to show the user.

export async function register({ username, email, password }) {
    const response = await api.post("/api/auth/register", { username, email, password })
    return response.data
}

export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", { email, password })
    return response.data
}

export async function logout() {
    const response = await api.get("/api/auth/logout")
    return response.data
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}
