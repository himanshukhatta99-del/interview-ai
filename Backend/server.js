const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])
require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/database")

// Fail fast with a clear message instead of crashing later with a confusing error.
const REQUIRED_ENV = [ "MONGO_URI", "JWT_SECRET", "GOOGLE_GENAI_API_KEY" ]
const missing = REQUIRED_ENV.filter((name) => !process.env[ name ])

if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`)
    console.error("Copy Backend/.env.example to Backend/.env and fill in the values.")
    process.exit(1)
}

const PORT = process.env.PORT || 3000

async function start() {
    // Connect to the database BEFORE accepting requests.
    await connectToDB()

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

start()
