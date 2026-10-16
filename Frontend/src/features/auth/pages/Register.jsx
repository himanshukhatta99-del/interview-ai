import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../../../utils/getErrorMessage'

const Register = () => {

    const navigate = useNavigate()
    const { handleRegister } = useAuth()

    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")
    const [ submitting, setSubmitting ] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        // Same rules as the backend, so users get instant feedback (the backend still re-checks everything).
        if (password.length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }

        setSubmitting(true)
        try {
            await handleRegister({ username, email, password })
            navigate("/")
        } catch (err) {
            setError(getErrorMessage(err, "Could not create your account. Please try again."))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="auth-page">
            <div className="form-container">
                <h1>Register</h1>

                <form onSubmit={handleSubmit}>
                    {error && <p className="alert alert--error" role="alert">{error}</p>}
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text" id="username" name='username' placeholder='Enter username'
                            autoComplete="username" minLength={3} maxLength={30} required />
                    </div>
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
                            type="password" id="password" name='password' placeholder='At least 8 characters'
                            autoComplete="new-password" minLength={8} maxLength={72} required />
                    </div>
                    <button className='button primary-button' disabled={submitting}>
                        {submitting ? "Creating account..." : "Register"}
                    </button>
                </form>

                <p>Already have an account? <Link to="/login">Login</Link></p>
            </div>
        </main>
    )
}

export default Register
