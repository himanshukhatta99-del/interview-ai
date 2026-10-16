import { useAuth } from "../hooks/useAuth"
import { Navigate } from "react-router"
import LoadingScreen from "../../../components/LoadingScreen"

/** Only lets logged-in users see `children`; everyone else is sent to /login. */
const Protected = ({ children }) => {
    const { loading, user } = useAuth()

    if (loading) {
        return <LoadingScreen />
    }

    if (!user) {
        return <Navigate to='/login' replace />
    }

    return children
}

export default Protected
