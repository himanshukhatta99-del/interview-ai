const test = require("node:test")
const assert = require("node:assert")
const { validateRegisterInput, validateLoginInput, validateReportInput } = require("../src/utils/validators")

test("register: accepts valid input", () => {
    assert.strictEqual(validateRegisterInput({ username: "jane_doe", email: "jane@mail.com", password: "longenough1" }), null)
})

test("register: rejects short password, bad email, bad username", () => {
    assert.match(validateRegisterInput({ username: "jane", email: "jane@mail.com", password: "short" }), /Password/)
    assert.match(validateRegisterInput({ username: "jane", email: "not-an-email", password: "longenough1" }), /email/)
    assert.match(validateRegisterInput({ username: "a", email: "jane@mail.com", password: "longenough1" }), /Username/)
})

test("register/login: rejects non-string values (NoSQL injection attempt)", () => {
    assert.ok(validateRegisterInput({ username: "jane", email: { $gt: "" }, password: "longenough1" }))
    assert.ok(validateLoginInput({ email: { $gt: "" }, password: "x" }))
})

test("login: requires email and password", () => {
    assert.ok(validateLoginInput({}))
    assert.ok(validateLoginInput(undefined))
    assert.strictEqual(validateLoginInput({ email: "a@b.com", password: "x" }), null)
})

test("report: needs job description and (resume or self description)", () => {
    const jd = "We need a React developer with Node experience."
    assert.ok(validateReportInput({ jobDescription: "" }, true))
    assert.ok(validateReportInput({ jobDescription: jd }, false))
    assert.strictEqual(validateReportInput({ jobDescription: jd }, true), null)
    assert.strictEqual(validateReportInput({ jobDescription: jd, selfDescription: "I know React" }, false), null)
})

test("report: enforces length limits", () => {
    assert.match(validateReportInput({ jobDescription: "x".repeat(5001), selfDescription: "hi" }, false), /5000/)
    assert.match(validateReportInput({ jobDescription: "x".repeat(50), selfDescription: "y".repeat(3001) }, false), /3000/)
})
