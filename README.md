<<<<<<< HEAD

# GEN+AI — Interview Readiness Reports

Full-stack app that takes a **resume (PDF)**, a **job description** and a **self-description**,
runs them through a local LLM, and produces an interview-readiness report: a match score,
hiring recommendation, skill gaps, tailored interview questions and a preparation plan.

```
GEN_AI/
├── Backend/      Express + MongoDB + Ollama   (the report engine)
├── Frontend/     React 19 + Vite + Tailwind 4 (the GEN+AI website)
└── tools/        Scripted API / browser checks used to verify the integration
```

---

## 1. Quick start

### Prerequisites

| Requirement              | Why                                     | Check                        |
| ------------------------ | --------------------------------------- | ---------------------------- |
| Node.js ≥ 20             | both apps                               | `node -v`                    |
| MongoDB (local or Atlas) | stores users + reports                  | `Backend/.env` → `MONGO_URI` |
| Ollama + a chat model    | the AI that writes the report           | `ollama list`                |
| Playwright (optional)    | only for the browser checks in `tools/` | `npm i -g playwright`        |

### 1. Configure the backend

```bash
cd Backend
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
```

`Backend/.env`

```env
PORT=3000
CLIENT_URL=http://localhost:5173     # comma separated list of allowed origins
MONGO_URI=mongodb://...
JWT_SECRET=<long random string>
SENSENOVA_API_KEY=sk-...             # your SenseNova API key
SENSENOVA_MODEL=sensenova-6.8-flash-lite
SENSENOVA_BASE_URL=https://token.sensenova.ai/v1

# Local fallback, used when SENSENOVA_API_KEY is empty
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_NUM_CTX=8192
OLLAMA_NUM_PREDICT=4096
```

The report engine talks to **SenseNova when `SENSENOVA_API_KEY` is set** and falls back to the
**local Ollama model** otherwise. The client is created lazily, so a missing key never stops the
server from booting.

`OLLAMA_NUM_CTX` and `OLLAMA_NUM_PREDICT` matter for the local fallback: the prompt (resume +
job description) and the answer have to fit in the context window. With a small window the model
answer is silently cut off and the JSON becomes invalid.

### 2. Configure the frontend

```bash
cd Frontend
cp .env.example .env
```

`Frontend/.env`

```env
VITE_API_URL=http://localhost:3000   # base URL of the backend
VITE_API_TIMEOUT_MS=3600000          # optional, 60 min default
```

### 3. Run

```bash
# terminal 1 — API
cd Backend && npm start        # nodemon server.js

# terminal 2 — website
cd Frontend && npm run dev     # http://localhost:5173
```


### 4. Verify

```bash
cd Frontend
npm run lint      # eslint
npm test          # node --test src  → 7 unit tests
npm run build     # production build

cd ../Backend
npm test          # node --test src  → 5 unit tests (truncated-JSON repair)
```

---

## 2. Architecture at a glance

```
 Browser (React 19 + Vite)
   │  src/lib/api.js  (axios, withCredentials, cookie auth)
   │  src/features/reports/services/report.api.js
   │
   │  POST /api/interview   multipart/form-data
   │    resume (PDF) · jobDescription · selfDescription
   ▼
 Express (Backend/src/app.js)  ── CORS(CLIENT_URL) ── cookieParser ── json
   │
   ├── authUser middleware        (JWT in the httpOnly "token" cookie)
   ├── uploadResume middleware    (multer, PDF only, ≤ 10 MB)
   │
   ▼
 interview.controller.js
   ├── pdf-parse  → resume text
   ├── services/ai.service.js  → 2 AI calls (assessment, questions+plan)
   ├── zod validation of the model output
   └── InterviewReportModel.create(...)  → MongoDB
   │
   ▼
 201 { message, report }  ──►  ReportResults.jsx renders it
```

The session is a **cookie**, not a token in `localStorage`: the browser sends `token`
automatically, and the backend signs it out into a blacklist collection on logout.

---

## 3. The report-generation data flow (step by step)

| #   | What happens                                                                                                     | Where it happens                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | User types the job description and self-description, drops a PDF resume                                          | `features/reports/pages/ReportGenerationPage.jsx`                     |
| 2   | File is validated client-side (PDF, ≤ 10 MB)                                                                     | `features/reports/utils/resume.js` → `validateResumeFile()`           |
| 3   | Submit is validated: all three inputs required; no request is sent if anything is missing                        | `ReportGenerationPage.handleSubmit()`                                 |
| 4   | Button enters the loading state and is `disabled` (no duplicate submits); status line explains what is happening | `ReportGenerationPage` (`status === "generating"`)                    |
| 5   | The three inputs are packed into `FormData` with the **exact field names the backend expects**                   | `features/reports/services/report.api.js` → `buildGenerateFormData()` |
| 6   | `POST /api/interview` is sent with credentials (cookie travels automatically)                                    | `lib/api.js` (axios instance)                                         |
| 7   | Express checks CORS, parses the cookie, verifies the JWT                                                         | `app.js`, `middlewares/auth.middleware.js`                            |
| 8   | Multer accepts the single `resume` file (PDF only, ≤ 10 MB, memory storage)                                      | `middlewares/file.middleware.js` → `uploadResume`                     |
| 9   | Controller checks the two text fields, extracts the PDF text                                                     | `controllers/interview.controller.js`                                 |
| 10  | **Part 1** — the model writes the assessment (score, summary, strengths, gaps, skills)                           | `services/ai.service.js` → `generateAssessment()`                     |
| 11  | **Part 2** — the model writes the questions and the preparation plan, using the gaps from part 1                 | `services/ai.service.js` → `generateQuestions()`                      |
| 12  | The answer is repaired if it was truncated, cleaned against the requested schema and validated with Zod        | `services/ai.service.js` → `fullReportZodSchema`                      |
| 13  | The report is saved against the signed-in user                                                                   | `models/interviewReport.model.js`                                     |
| 14  | `201 { message, report }` is returned                                                                            | controller                                                            |
| 15  | The response is validated, the report is stored in state, the page scrolls to it                                 | `report.api.js` → `requireReport()`, `ReportGenerationPage`           |
| 16  | The report is rendered section by section                                                                        | `features/reports/components/ReportResults.jsx`                       |
| 17  | The saved report also appears in “Your reports” and in the report studio                                         | `GET /api/interview` and `GET /api/interview/:id`                     |

**Field names are a contract — do not rename one side only.**
`resume` · `jobDescription` · `selfDescription` appear in
`report.api.js` (frontend) and `interview.routes.js` / `interview.controller.js` (backend).
`report.api.test.js` locks this down with a unit test.

---

## 4. API contract

### Auth — `/api/auth`

| Method | Path                 | Body                            | Returns                                              |
| ------ | -------------------- | ------------------------------- | ---------------------------------------------------- |
| POST   | `/api/auth/register` | `{ username, email, password }` | `201 { message, user }` + `token` cookie             |
| POST   | `/api/auth/login`    | `{ email, password }`           | `200 { message, user }` + `token` cookie             |
| GET    | `/api/auth/logout`   | –                               | `200 { message }`, cookie cleared, token blacklisted |
| GET    | `/api/auth/get-me`   | –                               | `200 { message, user }` (private)                    |

### Reports — `/api/interview` (all private)

| Method | Path                 | Body                                                           | Returns                                                   |
| ------ | -------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| POST   | `/api/interview`     | multipart: `resume` (PDF), `jobDescription`, `selfDescription` | `201 { message, report }`                                 |
| GET    | `/api/interview`     | –                                                              | `200 { message, count, reports[] }` (summary fields only) |
| GET    | `/api/interview/:id` | –                                                              | `200 { message, report }` (full report)                   |
| DELETE | `/api/interview/:id` | –                                                              | `200 { message }`                                         |

**Request**

```bash
curl -b cookies.txt \
  -F "resume=@C:/path/Hassnain_Shabbir_Resume.pdf;type=application/pdf" \
  -F "jobDescription=<job.txt" \
  -F "selfDescription=<self.txt" \
  http://localhost:3000/api/interview
```

**Response (shape)**

```jsonc
{
  "message": "Interview report generated successfully.",
  "report": {
    "candidateName": "Hassnain Shabbir",
    "targetRole": "Senior Frontend Engineer (React)",
    "matchScore": 72,
    "hiringRecommendation": "Proceed to Technical Interview",
    "executiveSummary": "…",
    "keyStrengths": ["…", "…", "…", "…"],
    "areasForGrowth": [{ "skill": "TypeScript", "severity": "high",
                         "explanation": "…", "recommendation": "…" }],
    "skillsAnalysis": [{ "skill": "React.js", "importance": "required",
                         "alignment": "strong", "evidence": "…", "assessment": "…" }],
    "interviewerFocusAreas": ["…"],
    "technicalQuestions":     [{ "question": "…", "intention": "…", "answer": "…",
                                "difficulty": "easy", "relatedSkill": "…" }],
    "systemDesignQuestions":  [ … same shape … ],
    "behavioralQuestions":    [ … same shape … ],
    "preparationPlan": [{ "day": 1, "focus": "…", "tasks": ["…"], "expectedOutcome": "…" }],
    "_id": "…", "createdAt": "…", "user": "…"
  }
}
```

The report **schema is the model** (`Backend/src/models/interviewReport.model.js`) and is
mirrored by the Zod schema in `ai.service.js` and by the renderer in `ReportResults.jsx`.
Change one → change all three.

---

## 5. What every file does

### 5.1 Backend (`Backend/`)

| File                                      | Responsibility                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.js`                               | Entry point. Loads `dotenv`, connects Mongo, starts Express on `PORT` (default 3000), raises `server.requestTimeout` so long AI runs are not cut off.                                                                                                                                                 |
| `.env`                                    | Real secrets. Never commit (`.gitignore` now covers it).                                                                                                                                                                                                                                              |
| `.env.example`                            | Template for the variables above.                                                                                                                                                                                                                                                                     |
| `src/app.js`                              | Express wiring: CORS (allowlist from `CLIENT_URL`, plus loopback in development), `express.json`, `cookieParser`, mounts `/api/auth` and `/api/interview`, and a **JSON error handler** so multer/CORS/body errors never return an HTML page.                                                         |
| `src/config/database.js`                  | Mongoose connection using `MONGO_URI`; sets DNS servers.                                                                                                                                                                                                                                              |
| `src/routes/auth.routes.js`               | Maps the four auth endpoints to their controller functions.                                                                                                                                                                                                                                           |
| `src/routes/interview.routes.js`          | The report routes. `POST /` is `authUser → uploadResume → generateInterviewController`.                                                                                                                                                                                                               |
| `src/middlewares/auth.middleware.js`      | Reads the `token` cookie, checks the blacklist collection, verifies the JWT with `JWT_SECRET`, attaches `req.user`. Returns 401 with a readable message on failure.                                                                                                                                   |
| `src/middlewares/file.middleware.js`      | Multer config: memory storage, one file, ≤ 10 MB, **PDF-only filter**. Exports `uploadResume()`, which converts multer errors (too large, wrong field name, wrong type) into the API’s JSON error shape.                                                                                              |
| `src/controllers/auth.controller.js`      | Register / login / logout / get-me. Hashes passwords with bcrypt, signs a 1-day JWT, sets the `token` cookie (`httpOnly`, `sameSite: lax`), blacklists tokens on logout.                                                                                                                              |
| `src/controllers/interview.controller.js` | The report controller: validates input, extracts PDF text with `pdf-parse`, calls the AI service, saves the report, returns it. Also list / get one / delete.                                                                                                                                         |
| `src/services/ai.service.js`              | The AI engine. Sends two structured requests to the configured provider (SenseNova when `SENSENOVA_API_KEY` is set, local Ollama otherwise), parses the replies (repairing an answer that was truncated by the token limit), cleans them against the requested JSON schema and validates everything with Zod. `SENSENOVA_*` / `OLLAMA_*` are configurable. |
| `src/services/ai.service.test.js`         | Unit tests for the truncated-JSON repair and the model-output cleaner.                                                                                                                                                                                                                       |
| `src/models/user.model.js`                | Mongoose schema for users (username, email, hashed password).                                                                                                                                                                                                                                         |
| `src/models/interviewReport.model.js`     | Mongoose schema for a report — this file _is_ the API contract for the report shape.                                                                                                                                                                                                                  |
| `src/models/blackList.model.js`           | Collection of logged-out tokens so an old cookie cannot be reused.                                                                                                                                                                                                                                    |
| `package.json`                            | `npm start` → `nodemon server.js`, `npm test` → `node --test src`.                                                                                                                                                                                                                                    |

### 5.2 Frontend (`Frontend/`)

#### Entry & routing

| File                 | Responsibility                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`         | Vite HTML shell, mounts `#root`.                                                                                                                                                                     |
| `vite.config.js`     | Vite + React + Tailwind v4 plugin, polling watcher for dev on Windows.                                                                                                                               |
| `src/main.jsx`       | React root: renders `<App/>` and loads `index.css`.                                                                                                                                                  |
| `src/App.jsx`        | Wraps the router in `AuthProvider` and enables the global button motion.                                                                                                                             |
| `src/app.routes.jsx` | All routes: `/` (landing), `/login`, `/register` (guests only), `/app` and `/app/report-studio` (**auth required**), `/app/interviewgenerator` → redirect to the studio.                             |
| `src/index.css`      | The whole design system: colour tokens, type scale, `.btn`, `.field`, `.textarea`, `.dropzone`, `.alert`, `.toast`, `.report*` primitives, plus a small amount of `dropzone[data-disabled]` styling. |

#### The API layer (this is what was added for the integration)

| File                                               | Responsibility                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/api.js`                                   | **The one axios instance** for the whole app. Base URL from `VITE_API_URL`, `withCredentials: true` (cookie auth), a long timeout (`VITE_API_TIMEOUT_MS`, default 60 min) for slow local inference, and `getApiErrorMessage()` which turns any failure (network, timeout, 401, 403, 413, 4xx, 5xx) into a **safe, user-readable** sentence. No stack traces, no internal paths, no secrets. |
| `src/features/reports/services/report.api.js`      | The reports API. `buildGenerateFormData()` builds the multipart body with the exact backend field names; `generateReport()`, `getReports()`, `getReport()`, `deleteReport()` call the API; `requireReport()` rejects a malformed response instead of rendering garbage.                                                                                                                     |
| `src/features/reports/services/report.api.test.js` | Unit test: the multipart body must contain `resume`, `jobDescription`, `selfDescription`, and the file must keep its original name.                                                                                                                                                                                                                                                         |
| `src/features/auth/services/auth.api.js`           | `register`, `login`, `logout`, `getMe` — all through the shared client in `lib/api.js`.                                                                                                                                                                                                                                                                                                     |

#### Auth feature

| File                                           | Responsibility                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/features/auth/authContext.js`             | Creates the React context object.                                                                          |
| `src/features/auth/auth.context.jsx`           | `AuthProvider`: on mount calls `getMe()` to restore the session, exposes `{ user, loading, initialized }`. |
| `src/features/auth/hooks/useAuth.js`           | `useAuth()` — the hook every component uses for `user`, `handleLogin`, `handleRegister`, `handleLogout`.   |
| `src/features/auth/components/RouteGuards.jsx` | `ProtectedRoute` (login required) and `GuestRoute` (redirects logged-in users to `/app`).                  |
| `src/features/auth/components/Protected.jsx`   | Wrapper variant of the guard for a single component.                                                       |
| `src/features/auth/pages/Login.jsx`            | Login form, validation, toast feedback, redirect to `/app`.                                                |
| `src/features/auth/pages/Register.jsx`         | Registration form with password confirmation.                                                              |

#### Reports feature (the generation workflow)

| File                                                  | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/reports/pages/ReportGenerationPage.jsx` | **The generation page.** Owns the three inputs, the validation, the loading state, the error state with a _Try again_ button that keeps the user’s input, the result section, and the “Your reports” list (loaded from `GET /api/interview`, reopen a report via `GET /api/interview/:id`).                                                                                                                                                     |
| `src/features/reports/pages/ReportStudioPage.jsx`     | The saved-report library: lists every report of the account, opens one full screen, refresh button, empty/loading/error states.                                                                                                                                                                                                                                                                                                                 |
| `src/features/reports/components/FileDropzone.jsx`    | Drag-and-drop + keyboard-accessible PDF picker, shows name and size, can be disabled while a report is generating.                                                                                                                                                                                                                                                                                                                              |
| `src/features/reports/components/ReportResults.jsx`   | **The renderer.** Renders only the sections the backend actually returned: candidate, target role, recommendation, match score + bar, executive summary, key strengths, areas for growth, skills analysis, interviewer focus areas, the three question groups (collapsible, with the intent and the model answer) and the preparation plan. Missing values are skipped, so `undefined` / `null` / `[object Object]` can never reach the screen. |
| `src/features/reports/utils/resume.js`                | `validateResumeFile()` (PDF only, ≤ 10 MB) and `formatFileSize()`.                                                                                                                                                                                                                                                                                                                                                                              |
| `src/features/reports/utils/resume.test.js`           | Unit tests for the file validation rules.                                                                                                                                                                                                                                                                                                                                                                                                       |

#### Shared UI & motion

| File                               | Responsibility                                                                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Brand.jsx`         | The “GEN+AI” wordmark.                                                                                                                                                                    |
| `src/components/Navbar.jsx`        | Public navigation with session-aware links and logout.                                                                                                                                    |
| `src/components/Footer.jsx`        | Landing page footer.                                                                                                                                                                      |
| `src/components/AuthShell.jsx`     | Split layout used by the login/register pages.                                                                                                                                            |
| `src/components/ReportSheet.jsx`   | The _sample_ report card used on the landing page only (clearly labelled “Sample”).                                                                                                       |
| `src/components/ReportPreview.jsx` | The decorative preview card on the landing page.                                                                                                                                          |
| `src/components/Loading.jsx`       | Full-screen loader shown while the session is being restored.                                                                                                                             |
| `src/components/Toast.jsx`         | Toast visual (success / error), animated.                                                                                                                                                 |
| `src/components/Reveal.jsx`        | Scroll-reveal wrapper.                                                                                                                                                                    |
| `src/hooks/useToast.js`            | Toast state with auto-dismiss.                                                                                                                                                            |
| `src/animations/*`                 | `animejs` helpers: `useEntrance`, `useMaskedLines`, `useScrollReveal`, `useSpin`, `useButtonMotion`, plus `animationConfig`/`animationUtils`. Purely decorative — they never affect data. |
| `src/data/reports.js`              | The **sample** data for the landing page only. Not used by the generation flow.                                                                                                           |
| `src/pages/LandingPage.jsx`        | The public marketing page.                                                                                                                                                                |
| `src/assets/fonts/*`               | General Sans (self-hosted).                                                                                                                                                               |

### 5.3 Verification tools (`tools/`)

Plain Node scripts, no test framework, no new dependencies.

| Script                   | What it does                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools/apitest.mjs`      | Full API check: registers a throwaway user, uploads a real PDF, prints the generated report summary, then checks the negative cases (missing resume, unauthenticated). `node tools/apitest.mjs` |
| `tools/list-reports.mjs` | Logs in as an existing user and lists / fetches their saved reports. `node tools/list-reports.mjs <email> <password>`                                                                           |
| `tools/ui-states.mjs`    | Playwright check of the states that do not need the AI: empty-form validation, file-type validation, loading/disabled state.                                                                    |
| `tools/e2e.mjs`          | Playwright check of the whole flow in a real browser: register, fill, upload, click _Generate with AI_, wait for the report, assert the sections and a clean console.                           |
| `tools/error-states.mjs` | Playwright check of the error paths: network failure, server error, malformed response.                                                                                                         |
| `tools/studio-check.mjs` | Logs in, opens a saved report in the studio and asserts that every section of the real backend payload is rendered. `node tools/studio-check.mjs <email> <password>`                            |

The Playwright scripts resolve Playwright from the global install
(`%APPDATA%\npm\node_modules\playwright`); set `PLAYWRIGHT_PATH` to override.

---

## 6. What changed in this integration

**Before:** the “Generate” button ran a 1.4-second `setTimeout` and rendered a hard-coded
sample report from `data/reports.js`. The backend had a working report endpoint that nothing
called. There was no API client, no environment configuration, and the report studio was a
placeholder page.

**After:**

| Area             | Change                                                                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API client       | New `src/lib/api.js` — one axios instance, env-driven base URL, cookie auth, safe error messages.                                                                                             |
| Reports API      | New `src/features/reports/services/report.api.js` — multipart generation, list, get, delete, response validation.                                                                             |
| Generation page  | Real request, real loading state, real error state with retry, real result section, real saved-report list.                                                                                   |
| Report rendering | New `ReportResults.jsx` rendering the backend payload section by section.                                                                                                                     |
| Report studio    | Real saved-report library instead of a placeholder.                                                                                                                                           |
| Routing          | `/app/report-studio` moved inside the protected routes.                                                                                                                                       |
| Backend CORS     | Allowlist from `CLIENT_URL` (was hard-coded to one origin) + a JSON error handler. Any loopback origin is allowed in development, so the request still works when Vite moves to another port. |
| Backend upload   | PDF-only filter, 10 MB limit, multer errors returned as JSON.                                                                                                                                 |
| Backend route    | Fixed a broken import (`uploadResume` did not exist → the POST route would have crashed).                                                                                                     |
| Backend AI       | `SENSENOVA_*` / `OLLAMA_*` from the environment, one provider for both passes, a repair step for an answer that was truncated by the token limit and a cleaner for half written model entries. |
| Backend server   | `PORT` from the environment, long request timeout for slow inference.                                                                                                                         |
| Config           | `.env.example` for both apps, `Backend/.gitignore`, `VITE_API_TIMEOUT_MS`.                                                                                                                    |
| Tests            | 7 frontend unit tests (multipart contract, resume validation) + 6 backend unit tests (JSON repair, model-output cleaner).                                                                    |

**Bugs found and fixed while wiring it up**

1. `interview.routes.js` imported a non-existent `uploadResume` export → the report route crashed.
2. Multer errors were returned as HTML → the frontend could not read a message; now JSON.
3. Non-PDF files were accepted by the upload middleware.
4. CORS was hard-coded to `http://localhost:5173`.
5. The frontend timeout was shorter than a real generation → the client gave up first.
6. The report studio was reachable without a session although the API is private.
7. Ollama host, port and model were hard-coded in the service.
8. The context window (`num_ctx: 4096`) was smaller than prompt + answer, so the second AI
   pass was cut off and its JSON could not be parsed → the whole request failed with `500`.
   The window and the answer limit are now configurable (8192 / 4096) and a truncated answer
   is repaired instead of being thrown away.
9. The React error summary in the generation page rendered list items without keys.
10. The AI service was migrated to the cloud provider, but the OpenAI client was created at
    import time: without a key the **whole backend failed to boot**. The client is now created
    lazily, and the local Ollama model is used as a fallback.
11. The second AI pass still called the removed `ollamaChat()` helper → `ReferenceError` on
    every request. Both passes now go through one `chatCompletion()` helper.
12. A model answer with a half written array entry (`areasForGrowth[1].explanation` missing)
    failed the Zod validation and killed the whole report. Incomplete entries are now dropped
    and unknown enum values fall back to a safe default.

---

## 7. Debugging playbook

Start here — 90% of problems are one of these.

### The request never leaves the browser

- Open DevTools → **Network** → filter `interview`. No row? The form validation stopped it —
  the red summary above the form lists what is missing.
- The button says “Generating report” and stays disabled: the request is in flight (see the
  slow-generation note below), or the backend is unreachable.

### `Network error` / “Could not reach the GEN+AI server”

```bash
curl -i http://localhost:3000/api/interview          # expect 401 JSON, not a connection error
```

- Backend not running → `cd Backend && npm start`.
- Wrong base URL → check `Frontend/.env` → `VITE_API_URL` and restart the dev server
  (Vite only reads `.env` at start).
- **CORS**: the browser blocks the response if the origin is not allowed. The backend allows
  `CLIENT_URL` (comma separated) plus any loopback origin in development. Check the
  `Access-Control-Allow-Origin` header in the Network tab.
- The backend binds to `localhost` only — use `http://localhost:3000`, not the LAN IP.

### `401 Authentication required`

- The `token` cookie is missing or expired. Log out and in again.
- Cookies require `withCredentials: true` (it is set in `lib/api.js`) and
  `credentials: true` + a matching `origin` in the CORS options (both are set).
- In production the cookie must be `secure: true` and `sameSite` must match your domain —
  see the cookie options in `auth.controller.js`.

### `400 Self-description and job description are required`

The two text fields are sent as `jobDescription` and `selfDescription`. If you renamed one,
rename it in **both** `report.api.js` and `interview.controller.js`.

### `400 The resume must be a PDF file.` / `400 Upload the resume as a single PDF using the "resume" field`

- The file is not a PDF (or the browser sent a different mime type) — the filter in
  `file.middleware.js` checks both the mime type and the `.pdf` extension.
- The field name must be exactly `resume`.

### `413 The resume must be smaller than 10 MB`

Both sides enforce 10 MB: `resume.js` (client) and `file.middleware.js` (server).

### `500 Failed to generate interview report.`

The AI step failed. Watch the **backend console** — `ai.service.js` logs the provider error.

```bash
# with the cloud provider
curl -H "Authorization: Bearer $SENSENOVA_API_KEY" $SENSENOVA_BASE_URL/models

# with the local fallback
ollama list                       # is the model installed?
curl http://127.0.0.1:11434/api/tags
```

- `Ollama error: ...` → Ollama is not running, or `OLLAMA_MODEL` names a model that is not
  pulled (`ollama pull qwen2.5:7b`). This only happens when no `SENSENOVA_API_KEY` is set.
- `401` / `Missing credentials` from the provider → `SENSENOVA_API_KEY` is missing or invalid.
- A Zod error → the model returned JSON that does not match the schema. The log shows which
  field failed; half written array entries are cleaned automatically, so this usually means
  the model is too small or the answer was cut off (`num_predict` / `OLLAMA_NUM_CTX`).
- “Could not extract text from this PDF” → the PDF is a scan without a text layer. The
  resume must be a text-based PDF.

### The request hangs for minutes

That is the model, not a bug. With the cloud provider a report takes ~1–2 minutes; the local
CPU-only model needs ~15–30 minutes for both AI passes. Check progress in the backend console
(`[AI] Part 1 …`, `[AI] Part 2 …`). Speed-ups: a smaller local model (`OLLAMA_MODEL=qwen2.5:3b`),
a GPU, or fewer/shorter questions in `ai.service.js`. The frontend waits up to 60 minutes
(`VITE_API_TIMEOUT_MS`).

### The report renders but the page looks empty

- “Your reports” is loaded from the API — if it is empty the user has no saved report yet.
- The studio needs a report id: open one from the list.

### The report shows raw JSON or `undefined`

`ReportResults.jsx` only renders known fields and skips empty values. If you see raw JSON,
the response did not match the expected shape — check `requireReport()` in `report.api.js`
and the console message from the API.

### Where to look first

| Symptom                       | File to open                                      |
| ----------------------------- | ------------------------------------------------- |
| Form does not send anything   | `features/reports/pages/ReportGenerationPage.jsx` |
| Wrong field names / body      | `features/reports/services/report.api.js`         |
| Base URL, cookies, error text | `src/lib/api.js`                                  |
| Report not displayed          | `features/reports/components/ReportResults.jsx`   |
| 401 / session problems        | `Backend/src/middlewares/auth.middleware.js`      |
| Upload rejected               | `Backend/src/middlewares/file.middleware.js`      |
| AI output / schema            | `Backend/src/services/ai.service.js`              |
| Saved report shape            | `Backend/src/models/interviewReport.model.js`     |
| CORS / JSON errors            | `Backend/src/app.js`                              |

---

## 8. Environment variables

| Variable              | Where    | Default                  | Purpose                                                                                     |
| --------------------- | -------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `PORT`                | Backend  | `3000`                   | API port.                                                                                   |
| `CLIENT_URL`          | Backend  | `http://localhost:5173`  | Allowed CORS origins (comma separated).                                                     |
| `MONGO_URI`           | Backend  | –                        | MongoDB connection string (required).                                                       |
| `JWT_SECRET`          | Backend  | –                        | Signs the session cookie (required).                                                        |
| `SENSENOVA_API_KEY`   | Backend  | –                        | Cloud provider key. When set it is used for both AI passes; otherwise Ollama is used.        |
| `SENSENOVA_BASE_URL`  | Backend  | `https://token.sensenova.ai/v1` | OpenAI compatible base URL of the cloud provider.                                   |
| `SENSENOVA_MODEL`     | Backend  | `sensenova-6.8-flash-lite` | Model used by the cloud provider.                                                         |
| `OLLAMA_URL`          | Backend  | `http://127.0.0.1:11434` | Ollama base URL (local fallback).                                                          |
| `OLLAMA_MODEL`        | Backend  | `qwen2.5:7b`             | Local model used for both AI passes when no cloud key is set.                              |
| `OLLAMA_NUM_CTX`      | Backend  | `8192`                   | Context window for the local model. Must fit the prompt plus the answer.                   |
| `OLLAMA_NUM_PREDICT`  | Backend  | `4096`                   | Maximum answer length. Too low truncates the JSON.                                         |
| `MAX_RESUME_MB`       | Backend  | `10`                     | Resume size limit. Use `4` on a host that caps the request body (serverless).               |
| `NODE_ENV`            | Backend  | `development`            | `production` disables the loopback CORS allowance and the dev error details.                |
| `VITE_API_URL`        | Frontend | `http://localhost:3000`  | Backend base URL used by the browser.                                                       |
| `VITE_API_TIMEOUT_MS` | Frontend | `3600000` (60 min)       | Client timeout for report generation.                                                       |

No secret ever reaches the frontend bundle: the AI keys stay in `Backend/.env`, and the
browser only ever holds an `httpOnly` cookie it cannot read.

---

## 9. Verification status

| Check                                                                      | Result                                                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run lint` (Frontend)                                                  | clean                                                                                                  |
| `npm run build` (Frontend)                                                 | ✓ builds                                                                                               |
| `npm test` (Frontend)                                                      | 7/7 pass                                                                                               |
| `npm test` (Backend)                                                       | 6/6 pass                                                                                               |
| Backend boot + Mongo connection                                            | ✓                                                                                                      |
| Live `POST /api/interview` with a real PDF                                 | ✓ `201`, full report, saved in Mongo                                                                   |
| Negative API cases (no file, no fields, wrong type, too large, no session) | ✓ correct JSON + status                                                                                |
| Browser: empty form                                                        | ✓ shows 3 validation messages, **0 requests sent**                                                     |
| Browser: generating                                                        | ✓ button disabled, progress text, one request only                                                     |
| Browser: multipart payload                                                 | ✓ `resume` (original filename, `application/pdf`), `jobDescription`, `selfDescription`                 |
| Browser: report rendering                                                  | ✓ all 8 sections, no `undefined` / `null` / `[object Object]`                                          |
| Browser: live generation                                                   | ✓ `201` after ~94 s (SenseNova), report rendered on the page (11 351 characters)                        |
| Browser: error paths                                                       | ✓ network failure, 500, malformed body, backend 400 → readable message, form kept, _Try again_ offered |
| Browser console                                                            | ✓ no exceptions; only the expected `401` from the session probe on a logged-out page                   |

---

## 10. Deployment (Vercel)

`vercel.json` deploys two services: the **frontend** (Vite) and the **backend** (Express as a
serverless function). `/api/*` is rewritten to the backend, so the browser talks to one origin.

Environment variables to set in the Vercel project (the backend service):

| Variable | Value | Why |
|---|---|---|
| `MONGO_URI` | your Atlas connection string | required |
| `JWT_SECRET` | a long random string | required, signs the session cookie |
| `SENSENOVA_API_KEY` | your provider key | the report engine |
| `SENSENOVA_MODEL` / `SENSENOVA_BASE_URL` | provider defaults | optional |
| `MAX_RESUME_MB` | `4` | a serverless request body is capped at ~4.5 MB |
| `CLIENT_URL` | the site origin | optional: a request from the same host is always allowed |

Things that matter for the deployment:

- `vercel.json` sets `"maxDuration": 300` for the backend: a report takes ~1–2 minutes, which
  is longer than the 60 s default function timeout.
- The resume limit follows the host: set `MAX_RESUME_MB=4` on Vercel (10 MB locally). The
  client is told the real limit through the error message.
- `Backend/server.js` exports the Express app when `process.env.VERCEL` is set, so the function
  does not open a port, and the database is connected once per cold start.
- `Frontend/.env.production` points `VITE_API_URL` at the deployed origin, so the browser
  calls `/api/...` on the same host (no CORS preflight, the session cookie is sent).

---

## 11. Known limitations

- **Generation time.** ~1–2 minutes per report with the cloud provider (SenseNova).
  The local fallback needs ~15–30 minutes on a CPU-only 8 GB machine. Free RAM matters for
  the local model: with less than ~2 GB free the Ollama runner is killed mid-request and the
  API answers `500`.
- **The AI provider must be reachable.** With `SENSENOVA_API_KEY` set the cloud provider is
  used, otherwise Ollama has to be running. If neither answers, the API returns `500` and the
  UI shows a readable error.
- **Text-based PDFs only.** A scanned resume yields “Could not extract text from this PDF”.
- **One report per request.** There is no queue, no progress streaming and no cancel button;
  the client waits for the HTTP response.
- **No automated test runner beyond `node --test`.** The React rendering is covered by the
  Playwright scripts in `tools/`, not by unit tests.
- `Frontend/src/data/reports.js` and `ReportSheet.jsx` are **sample** data for the landing
  page only — they are not part of the generation flow.
  =======

# GEN-AI-BY-HASSNAIN

GEN+AI is an AI-powered web application built using the MERN stack, focused on intelligent interview preparation, AI-generated reports, and modern user experiences.

> > > > > > > 3a702855dc27c55fb7a7d5a53b033c11f8b343c9
