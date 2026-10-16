import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../../../utils/getErrorMessage'

const Login = () => {

    const { handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")
    const [ submitting, setSubmitting ] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSubmitting(true)

        try {
            await handleLogin({ email, password })
            navigate('/') // only reached if the login really succeeded
        } catch (err) {
            setError(getErrorMessage(err, "Could not log in. Please try again."))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="auth-page">
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    {error && <p className="alert alert--error" role="alert">{error}</p>}
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email" id="email" name='email' placeholder='Enter email address'
                            autoComplete="email" required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password" id="password" name='password' placeholder='Enter password'
                            autoComplete="current-password" required />
                    </div>
                    <button className='button primary-button' disabled={submitting}>
                        {submitting ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div>
        </main>
    )
}

export default Login
