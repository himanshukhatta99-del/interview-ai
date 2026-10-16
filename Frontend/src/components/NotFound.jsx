import { Link } from "react-router"

const NotFound = () => (
    <main className='loading-screen'>
        <h1>Page not found</h1>
        <p><Link to="/" className='highlight'>Go back home</Link></p>
    </main>
)

export default NotFound
