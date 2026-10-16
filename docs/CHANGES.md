# What was changed and why

This is the list of improvements made to the original project. Everything the original did still works; the structure (feature folders, hooks, context, services) was kept.

## Security fixes

| Problem in original | Fix | File |
|---|---|---|
| **Any logged-in user could generate a resume PDF from another user's report** (`findById` with no owner check) | All report reads, deletes and PDF exports go through `findOwnedReport()`, which filters by `user` | `Backend/src/controllers/interview.controller.js` |
| Login cookie readable by JavaScript | `httpOnly`, `sameSite`, `secure` (production), 1-day `maxAge`; same options when clearing | `auth.controller.js` |
| Login accepted objects (`{"$gt":""}`) as email: NoSQL injection | `typeof === "string"` checks on every input | `utils/validators.js` |
| No password rules, any email string accepted | Username/email/password validation (8-72 chars) | `utils/validators.js`, `auth.controller.js` |
| Unlimited AI calls and login attempts | `express-rate-limit` on login/register and AI routes | `middlewares/rateLimit.middleware.js` |
| Uploaded "PDF" trusted by mimetype only | Mimetype filter **and** `%PDF` signature check | `file.middleware.js`, `pdf.service.js` |
| Puppeteer ran untrusted AI-generated HTML with JavaScript on | JavaScript disabled; browser always closed in `finally` | `ai.service.js` |
| Prompt could invent employers/dates in the resume | Prompt forbids fabrication; user data is marked as data, not instructions | `ai.service.js` |

## Bugs fixed

| Bug | Fix |
|---|---|
| Wrong password: nothing shown, app still navigated | Errors now propagate; page shows the message and only navigates on success |
| Crash when no resume was uploaded (`req.file.buffer`) | Resume is optional; validated properly (needs resume **or** self description) |
| `useInterview` crashed after any failed request (`response.interviewReport` on `null`) | Every action catches errors, sets `error`, returns `null` |
| Report fetched twice; every `useAuth()` call re-ran `getMe` | Single fetch in the page; auth check moved into `AuthProvider` (runs once) |
| Whole page replaced by "Loading" while typing/deleting/downloading | Separate `loading` / `generating` states; form keeps your input if generation fails |
| Character counter always said `0 / 5000` | Real counter |
| UI promised DOCX and 5MB, backend only accepted PDF and 3MB | UI text and validation now match the backend |
| "Strong match" shown for every score | Message depends on score |
| Dead footer links, unused imports, 14 lint errors | Removed; lint is clean |
| Global `main { ... }` CSS rule leaked into every page | Scoped to `.auth-page` |
| `.match-score` class defined twice with different meanings | Home list uses `report-item__score` |
| Clicked `<div>`s that keyboards could not use | Real `<button>` / `<Link>` elements |
| Blacklist collection grew forever | TTL index deletes entries after 1 day |
| Crash on malformed report id | 404 instead of CastError / 500 |

## New features (small and justified)

- Delete a report (`DELETE /api/interview/report/:id` + button)
- Logout button, "All plans" link, empty states, 404 page, redirect away from login when logged in
- Drag-and-drop works; chosen file name shown with a remove button
- Central Express error handler, health endpoint, startup check for missing env variables
- Zod validation of the AI response, score clamped to 0-100
- Responsive CSS (phone, tablet, desktop), focus outlines, ARIA labels, page title and description
- `.env.example` files, README, 25 backend tests

## Dependencies

Only **one** was added: `express-rate-limit`. Everything else uses what the project already had.
