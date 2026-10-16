/**
 * API-level tests. They run the REAL Express app (routes, middlewares, controllers)
 * but replace the database and the AI service with fakes, so no MongoDB or Gemini key is needed.
 */
process.env.JWT_SECRET = "test-secret"
process.env.GOOGLE_GENAI_API_KEY = "fake-key"
process.env.NODE_ENV = "test"

const test = require("node:test")
const assert = require("node:assert")
const jwt = require("jsonwebtoken")
const path = require("path")

// Replace the AI service BEFORE the app loads it (controllers import it at load time).
const aiPath = require.resolve("../src/services/ai.service")
let aiCalls = 0
require.cache[ aiPath ] = {
    id: aiPath, filename: aiPath, loaded: true,
    exports: {
        generateInterviewReport: async () => { aiCalls++; return { matchScore: 80, title: "Dev", technicalQuestions: [], behavioralQuestions: [], skillGaps: [], preparationPlan: [] } },
        generateResumePdf: async () => Buffer.from("%PDF-fake")
    }
}

const app = require("../src/app")
const interviewReportModel = require("../src/models/interviewReport.model")
const tokenBlacklistModel = require("../src/models/blacklist.model")
const userModel = require("../src/models/user.model")

const ALICE = "64b000000000000000000001"
const BOB = "64b000000000000000000002"
const REPORT_ID = "64c000000000000000000001" // belongs to ALICE

// Fake database
tokenBlacklistModel.findOne = async () => null
interviewReportModel.findOne = async ({ _id, user }) =>
    (String(_id) === REPORT_ID && String(user) === ALICE)
        ? { _id: REPORT_ID, resume: "r", jobDescription: "j", selfDescription: "s", deleteOne: async () => { } }
        : null
interviewReportModel.create = async (data) => ({ _id: "new-id", ...data })
userModel.findOne = async () => null

let server, base
test.before(async () => {
    await new Promise((resolve) => { server = app.listen(0, resolve) })
    base = `http://127.0.0.1:${server.address().port}`
})
test.after(() => server.close())

const tokenFor = (id) => jwt.sign({ id, username: "u" }, process.env.JWT_SECRET)
const asUser = (id) => ({ Cookie: `token=${tokenFor(id)}` })

test("health check works", async () => {
    const res = await fetch(`${base}/api/health`)
    assert.strictEqual(res.status, 200)
})

test("protected routes reject requests without a token", async () => {
    const res = await fetch(`${base}/api/interview/`)
    assert.strictEqual(res.status, 401)
})

test("protected routes reject a forged token", async () => {
    const forged = jwt.sign({ id: ALICE }, "wrong-secret")
    const res = await fetch(`${base}/api/interview/`, { headers: { Cookie: `token=${forged}` } })
    assert.strictEqual(res.status, 401)
})

test("SECURITY: another user cannot read someone else's report", async () => {
    const res = await fetch(`${base}/api/interview/report/${REPORT_ID}`, { headers: asUser(BOB) })
    assert.strictEqual(res.status, 404)
})

test("SECURITY: another user cannot generate a resume PDF from someone else's report (the original IDOR bug)", async () => {
    const res = await fetch(`${base}/api/interview/resume/pdf/${REPORT_ID}`, { method: "POST", headers: asUser(BOB) })
    assert.strictEqual(res.status, 404)
})

test("SECURITY: another user cannot delete someone else's report", async () => {
    const res = await fetch(`${base}/api/interview/report/${REPORT_ID}`, { method: "DELETE", headers: asUser(BOB) })
    assert.strictEqual(res.status, 404)
})

test("the owner can read, export and delete their report", async () => {
    let res = await fetch(`${base}/api/interview/report/${REPORT_ID}`, { headers: asUser(ALICE) })
    assert.strictEqual(res.status, 200)
    res = await fetch(`${base}/api/interview/resume/pdf/${REPORT_ID}`, { method: "POST", headers: asUser(ALICE) })
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers.get("content-type"), "application/pdf")
    res = await fetch(`${base}/api/interview/report/${REPORT_ID}`, { method: "DELETE", headers: asUser(ALICE) })
    assert.strictEqual(res.status, 200)
})

test("a malformed report id returns 404, not a 500 crash", async () => {
    const res = await fetch(`${base}/api/interview/report/not-an-id`, { headers: asUser(ALICE) })
    assert.strictEqual(res.status, 404)
})

test("generate: missing job description is a 400 and the AI is NOT called", async () => {
    const before = aiCalls
    const form = new FormData()
    form.append("selfDescription", "I know React")
    const res = await fetch(`${base}/api/interview/`, { method: "POST", headers: asUser(ALICE), body: form })
    assert.strictEqual(res.status, 400)
    assert.strictEqual(aiCalls, before)
})

test("generate: no resume file and no self description is a 400 (used to crash the server request)", async () => {
    const form = new FormData()
    form.append("jobDescription", "We are hiring a React developer with Node.js experience.")
    const res = await fetch(`${base}/api/interview/`, { method: "POST", headers: asUser(ALICE), body: form })
    assert.strictEqual(res.status, 400)
})

test("generate: non-PDF upload is rejected", async () => {
    const form = new FormData()
    form.append("jobDescription", "We are hiring a React developer with Node.js experience.")
    form.append("resume", new Blob([ "hello" ], { type: "text/plain" }), "resume.txt")
    const res = await fetch(`${base}/api/interview/`, { method: "POST", headers: asUser(ALICE), body: form })
    assert.strictEqual(res.status, 400)
    assert.match((await res.json()).message, /PDF/)
})

test("generate: file that claims to be a PDF but isn't is rejected", async () => {
    const form = new FormData()
    form.append("jobDescription", "We are hiring a React developer with Node.js experience.")
    form.append("resume", new Blob([ "not really a pdf" ], { type: "application/pdf" }), "resume.pdf")
    const res = await fetch(`${base}/api/interview/`, { method: "POST", headers: asUser(ALICE), body: form })
    assert.strictEqual(res.status, 400)
})

test("generate: valid request with self description succeeds", async () => {
    const form = new FormData()
    form.append("jobDescription", "We are hiring a React developer with Node.js experience.")
    form.append("selfDescription", "Fresher who built a MERN project")
    const res = await fetch(`${base}/api/interview/`, { method: "POST", headers: asUser(ALICE), body: form })
    assert.strictEqual(res.status, 201)
    assert.strictEqual((await res.json()).interviewReport.matchScore, 80)
})

test("generate: a real PDF resume is parsed and accepted", async () => {
    const fs = require("fs")
    const pdfBytes = fs.readFileSync(path.join(__dirname, "fixtures", "sample-resume.pdf"))
    const form = new FormData()
    form.append("jobDescription", "We are hiring a React developer with Node.js experience.")
    form.append("resume", new Blob([ pdfBytes ], { type: "application/pdf" }), "resume.pdf")
    const res = await fetch(`${base}/api/interview/`, { method: "POST", headers: asUser(ALICE), body: form })
    assert.strictEqual(res.status, 201)
    assert.match((await res.json()).interviewReport.resume, /React Developer/)
})

test("register: weak password is rejected before touching the database", async () => {
    const res = await fetch(`${base}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "jane", email: "jane@mail.com", password: "123" })
    })
    assert.strictEqual(res.status, 400)
})

test("login: request without a body returns 400 instead of crashing", async () => {
    const res = await fetch(`${base}/api/auth/login`, { method: "POST" })
    assert.strictEqual(res.status, 400)
})

test("login: unknown user gets a generic 401", async () => {
    const res = await fetch(`${base}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nobody@mail.com", password: "whatever123" })
    })
    assert.strictEqual(res.status, 401)
})

test("login: cookie is httpOnly", async () => {
    const bcrypt = require("bcryptjs")
    const hash = await bcrypt.hash("correct-password", 4)
    userModel.findOne = async () => ({ _id: ALICE, username: "alice", email: "alice@mail.com", password: hash })
    const res = await fetch(`${base}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "Alice@Mail.com", password: "correct-password" })
    })
    assert.strictEqual(res.status, 200)
    assert.match(res.headers.get("set-cookie"), /HttpOnly/i)
    userModel.findOne = async () => null
})

test("unknown routes return a JSON 404", async () => {
    const res = await fetch(`${base}/api/nope`)
    assert.strictEqual(res.status, 404)
    assert.ok((await res.json()).message)
})
