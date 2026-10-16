const LoadingScreen = ({ message = "Loading..." }) => (
    <main className='loading-screen' role="status" aria-live="polite">
        <h1>{message}</h1>
    </main>
)

export default LoadingScreen
