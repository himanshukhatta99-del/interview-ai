import { useContext } from "react"
import { AuthContext } from "../auth.context.js"
import { login, register, logout } from "../services/auth.api.js"

/**
 * Gives components the current user and the login/register/logout actions.
 * handleLogin and handleRegister THROW on failure, so the page can show the error message
 * and only navigate when the call really succeeded.
 */
export const useAuth = () => {

    const { user, setUser, loading } = useContext(AuthContext)

    const handleLogin = async ({ email, password }) => {
        const data = await login({ email, password })
        setUser(data.user)
        return data.user
    }

    const handleRegister = async ({ username, email, password }) => {
        const data = await register({ username, email, password })
        setUser(data.user)
        return data.user
    }

    const handleLogout = async () => {
        try {
            await logout()
        } finally {
            // Even if the request failed, forget the user locally so the UI returns to the login page.
            setUser(null)
        }
    }

    return { user, loading, handleRegister, handleLogin, handleLogout }
}
