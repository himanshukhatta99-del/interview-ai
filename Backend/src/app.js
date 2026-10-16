const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware")

const app = express()

// When deployed behind a proxy (Render, Railway...) this lets rate limiting see the real client IP.
if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1)
}

app.use(express.json({ limit: "100kb" }))
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }))
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

/* these two must stay LAST */
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
