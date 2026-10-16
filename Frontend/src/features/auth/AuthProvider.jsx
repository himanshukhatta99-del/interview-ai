import { useEffect, useState } from "react"
import { AuthContext } from "./auth.context.js"
import { getMe } from "./services/auth.api.js"

/**
 * Holds "who is logged in" for the whole app.
 * On first load it asks the backend (/get-me) whether the login cookie is still valid.
 * `loading` is true only during that first check, so route guards know when to decide.
 */
export const AuthProvider = ({ children }) => {

    const [ user, setUser ] = useState(null)
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        let ignore = false // prevents state updates after the component unmounted

        getMe()
            .then((data) => { if (!ignore) setUser(data.user) })
            .catch(() => { /* 401 just means "not logged in", which is a normal state */ })
            .finally(() => { if (!ignore) setLoading(false) })

        return () => { ignore = true }
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
