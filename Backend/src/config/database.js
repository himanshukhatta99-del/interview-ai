const mongoose = require("mongoose")

async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to Database")
    } catch (err) {
        // If the database is down the API is useless, so stop the process
        // (instead of silently running and failing on every request).
        console.error("Could not connect to the database:", err.message)
        process.exit(1)
    }
}

module.exports = connectToDB
