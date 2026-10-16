import axios from "axios"

/**
 * One shared axios instance for the whole app.
 * - baseURL comes from the VITE_API_URL environment variable (see .env.example),
 *   so the same code works on localhost and when deployed.
 * - withCredentials makes the browser send the login cookie with every request.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})

export default api
