import { useAuth } from "../hooks/useAuth"
import { Navigate } from "react-router"
import LoadingScreen from "../../../components/LoadingScreen"

/** The opposite of Protected: logged-in users don't need the login/register pages. */
const GuestOnly = ({ children }) => {
    const { loading, user } = useAuth()

    if (loading) {
        return <LoadingScreen />
    }

    if (user) {
        return <Navigate to='/' replace />
    }

    return children
}

export default GuestOnly
