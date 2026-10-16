# Interview Prep Guide for This Project

How to use this: read each answer, then **open the file mentioned and find the code yourself**. If you can point at the line, you can explain it. Answers are written in simple first-person language you can adapt. Anything marked **(my improvement)** was added in the improvement pass; be clear about that if asked what is original.

## A note on honesty (read this first)

The project's structure and idea come from a tutorial-style codebase. If an interviewer asks, say so calmly and focus on what **you** can explain and what you changed. A good line:

> "I started from a tutorial to learn the MERN + AI-API pattern, then I audited it, found a few real bugs and a security hole, and fixed them. I can walk you through any part."

Interviewers trust honest candidates who understand the code far more than candidates who can't explain "their own" project. Update the README "Credits" section so it matches what you say.

---

## Project and design questions

### 1. Walk me through the project in one minute.
It's an AI interview-prep tool. A user logs in, pastes a job description and uploads a resume PDF (or writes a short self-description). The backend extracts the resume text, sends everything to the Gemini API, and gets back a structured report: match score, technical and behavioural questions, skill gaps and a day-by-day plan. The report is saved in MongoDB and shown on a report page. The user can also download an AI-tailored resume PDF.

### 2. Why React + Node/Express + MongoDB?
React for a component-based UI with state. Express is a small, flexible API layer. MongoDB fits because a report is one nested document (questions, gaps, plan) that I always read whole, so I don't need joins. Same language (JavaScript) on both sides, which is good while learning.

### 3. How is the code organised?
Frontend uses **feature folders**: `features/auth` and `features/interview`, each with pages, a hook, an API service and a context provider. Backend follows routes → middlewares → controllers → services → models. Each layer has one job: routes map URLs, controllers handle request/response, services talk to outside systems (Gemini, PDF), models describe data.

## React questions

### 4. How does data flow through the frontend?
`Home.jsx` (page) calls `useInterview()` (hook). The hook calls `interview.api.js` (axios), and on success stores the result in Context state. Pages re-render because they read that state. The page never calls axios directly. Files: `features/interview/hooks/useInterview.js`, `InterviewProvider.jsx`.

### 5. What is Context and why did you use it? Why not Redux?
Context lets many components read shared state without passing props down through every level. I used it for two things: who is logged in (`AuthProvider`) and the interview data. The app is small, so Redux would add boilerplate without a benefit.

### 6. State vs props: where do you use each?
State is data a component owns and can change: `jobDescription`, `selfDescription`, `resumeFile`, `formError` in `Home.jsx`. Props are values passed from parent to child: `QuestionCard` receives `item` and `index` in `Interview.jsx`. A child can't modify its props.

### 7. Explain your `useEffect` calls.
`Home` loads the previous plans once when it mounts (empty dependency array). `Interview` loads one report whenever `interviewId` from the URL changes. `AuthProvider` checks `/get-me` once on startup, with an `ignore` flag so it doesn't set state after unmounting.
Honest detail: the first two call a function that is recreated every render, so I disabled the exhaustive-deps lint rule on those lines with a comment. A cleaner fix would be `useCallback`, which I'd do next.

### 8. What are controlled inputs?
Inputs whose value comes from state (`value={jobDescription}` plus `onChange`). That's why the character counter is live, and why the text is still there when generation fails.

### 9. How do protected routes work?
`Protected.jsx` reads `user` and `loading` from `useAuth()`. While the first auth check runs it shows a loading screen; if there's no user it redirects to `/login` with `<Navigate>`; otherwise it renders the page. `GuestOnly.jsx` does the reverse for login/register. **(my improvement: GuestOnly, and the single auth check)**

### 10. Why did you split `auth.context.js` and `AuthProvider.jsx`?
React's fast-refresh lint rule wants a file to export only components. The context object goes in a `.js` file, the provider component in `.jsx`. **(my improvement)**

## Backend, API and data questions

### 11. How does authentication work?
On login the server checks the password with bcrypt, then signs a JWT with `JWT_SECRET` and sends it in a cookie. For protected routes `auth.middleware.js` reads the cookie, verifies the signature, checks the token isn't blacklisted, and puts the user on `req.user`. Logout adds the token to a blacklist collection that auto-deletes entries after a day (TTL index). The cookie is `httpOnly`, so JavaScript can't steal it. **(cookie flags and TTL: my improvement)**

### 12. Why a cookie instead of localStorage?
localStorage is readable by any script on the page, so an XSS bug could steal the token. An `httpOnly` cookie can't be read by JavaScript. Trade-off: cookies need CORS `credentials: true` and CSRF thinking; `sameSite` helps with that.

### 13. How do you call the AI and make sure the response is usable?
`ai.service.js` sends the prompt with a JSON schema (built from a Zod schema) and asks Gemini for JSON only. I still don't trust it: the text is parsed and validated with Zod, and the score is clamped to 0-100 before saving. If Gemini fails, the user gets a clear 502 message instead of a crash. **(validation and error mapping: my improvement)**

### 14. Tell me about a security problem you found.
The resume-PDF endpoint looked up the report with `findById(id)` and never checked who owned it, so any logged-in user who knew a report id could build a resume from someone else's data. This is called an IDOR (insecure direct object reference). The fix is `findOwnedReport()`, which queries by both `_id` and `user`. I wrote three tests that log in as a different user and assert a 404. Files: `interview.controller.js`, `tests/api.test.js`.

### 15. How do you handle errors end to end?
Backend: validation returns 400, auth failures 401, not-found/not-yours 404, AI failures 502. Express 5 forwards errors from async controllers to one central handler (`error.middleware.js`) that hides internals from the client. Frontend: the hook catches every failure, stores a readable message, and pages show it in an alert; nothing crashes. 401 responses log the user out in the UI. **(my improvement)**

### 16. What does validation protect against?
Bad input (short passwords, missing fields), cost abuse (limits on text length, file size, rate limiting), and NoSQL injection: if someone sends `{"email": {"$gt": ""}}`, Mongo would treat it as an operator, so I reject anything that isn't a string. Pure functions in `utils/validators.js` are unit-tested.

### 17. How are file uploads handled?
multer keeps the PDF in memory (max 3MB, PDF mimetype). I then check the file really starts with `%PDF` (mimetype can be faked), extract text with pdf-parse, and store only the text, not the file.

## Process and growth questions

### 18. How did you test it?
25 backend tests with Node's built-in runner. They start the real Express app but replace MongoDB and Gemini with fakes, so they run anywhere. They cover validation, auth, ownership, uploads and error responses. On the frontend I run ESLint and the production build. Honest gap: no automated frontend tests yet; I'd add Vitest + React Testing Library next.

### 19. What was the hardest problem?
Pick one you truly understood. Good candidates: the auth error flow (errors were swallowed in three layers, so a wrong password silently redirected), or the `useInterview` crash caused by reading `response.interviewReport` after a failed request. Explain symptom, cause, fix.

### 20. What would you improve next?
Stream the AI response so users see progress instead of a 30-second wait; support DOCX; `useCallback` for the hook functions; frontend tests; deploy with CI running the backend tests; and move PDF generation to a background job because launching Chrome per request is heavy.

---

## Resume bullets (use only what is true when you apply)

**Project title:** AI Interview Prep Planner (React, Node.js, Express, MongoDB, Gemini API)

- Built a full-stack MERN app that turns a job description and resume into a personalised interview plan (match score, questions, skill gaps, study roadmap) using Google Gemini with schema-validated structured output
- Implemented cookie-based JWT authentication, per-user data ownership checks, server-side validation and rate limiting; found and fixed an insecure-direct-object-reference bug and covered it with automated tests
- Designed a React feature-based architecture (Context + custom hooks + API service layer) with loading/error/empty states and a responsive UI; wrote 25 backend tests with Node's test runner

Add "Deployed on Render/Vercel" and a live link **only after you actually deploy**. Don't list "tested with X users" or performance numbers you haven't measured.

## Before the interview checklist

- [ ] Run it locally and click every feature once
- [ ] Open each file mentioned above and read it until you can explain it without looking
- [ ] Deliberately break something (wrong password, stop the backend) and watch how the UI reacts
- [ ] Update the README Credits section so it's accurate
- [ ] Deploy and add the live link and your own screenshots
