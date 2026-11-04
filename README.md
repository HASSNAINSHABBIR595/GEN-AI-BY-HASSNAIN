# GEN+AI — AI-Powered Interview Readiness Reports

> Upload your **resume (PDF)**, paste a **job description** and a **self-description** — GEN+AI runs them through an LLM and produces a structured interview-readiness report: a match score, hiring recommendation, skill-gap analysis, tailored interview questions, and a day-by-day preparation plan.

```
GEN_AI/
├── Backend/      Express 5 + MongoDB + SenseNova API  (deployed on Vercel)
├── Frontend/     React 19 + Vite 8 + Tailwind 4       (deployed on Vercel)
└── tools/        Scripted API / browser checks (Node + Playwright)
```

**Live URLs**

| Service | URL |
|---|---|
| Backend API | https://gen-ai-by-hassnain.vercel.app |
| Frontend App | https://gen-ai-by-hassnain-buyg.vercel.app |

> The backend runs as a **Vercel serverless function** (`Backend/api/index.js`). There is no
> long-running server process in production.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Architecture Overview](#2-architecture-overview)
3. [Report Generation — Step by Step](#3-report-generation--step-by-step)
4. [API Reference](#4-api-reference)
5. [File Reference](#5-file-reference)
6. [Deployment (Vercel)](#6-deployment-vercel)
7. [Debugging Playbook](#7-debugging-playbook)
8. [Environment Variables](#8-environment-variables)
9. [Security Notes](#9-security-notes)
10. [Known Limitations](#10-known-limitations)

---

## 1. Quick Start

### Prerequisites

| Requirement | Why | Check |
|---|---|---|
| Node.js ≥ 20 | Both apps | `node -v` |
| MongoDB (local or Atlas) | Stores users & reports | `Backend/.env` → `MONGO_URI` |
| SenseNova API key | The LLM that writes the report | `SENSENOVA_API_KEY` |
| Playwright *(optional)* | Only for the browser checks in `tools/` | `npm i -g playwright` |

### Step 1 — Configure the backend

Create `Backend/.env` (this file is git-ignored and must **never** be committed):

```env
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>

# Auth — signs the JWT; use a long random string
JWT_SECRET=<long-random-string>

# CORS — comma-separated list of extra allowed origins
CLIENT_URL=http://localhost:5173

# AI provider (SenseNova — OpenAI-compatible)
SENSENOVA_API_KEY=<key>
SENSENOVA_MODEL=sensenova-6.8-flash-lite
SENSENOVA_BASE_URL=https://token.sensenova.ai/v1
```

### Step 2 — Configure the frontend

```bash
cd Frontend
cp .env.example .env
```

Edit `Frontend/.env`:

```env
VITE_API_URL=http://localhost:3000   # backend base URL
VITE_API_TIMEOUT_MS=3600000          # optional; 60 min default
```

> Vite inlines env vars at build time — restart the dev server after changing them.

### Step 3 — Install and run

```bash
# terminal 1 — API server (local only)
cd Backend
npm install
npm start           # node server.js  →  http://localhost:3000

# terminal 2 — React dev server
cd Frontend
npm install
npm run dev         # http://localhost:5173
```

### Step 4 — Verify

```bash
# Frontend
cd Frontend
npm run lint        # ESLint
npm test            # node --test src  (unit tests)
npm run build       # production build

# Backend
cd Backend
npm test            # node --test src  (AI JSON-repair unit tests)
```

---

## 2. Architecture Overview

```
Browser  (React 19 + Vite 8 + Tailwind 4 + anime.js)
  │  src/lib/api.js  — axios instance, Authorization: Bearer <token>
  │  token stored in localStorage under the key "token"
  │
  │  POST /api/interview   multipart/form-data
  │    resume (PDF) · jobDescription · selfDescription
  ▼
Express 5  (Backend/src/app.js)
  │  CORS allowlist · express.json · cookieParser
  │
  ├── authUser middleware        (Bearer token; cookie fallback)
  ├── uploadResume middleware    (multer — PDF only, ≤ 10 MB, memory storage)
  │
  ▼
interview.controller.js
  ├── pdf-parse         → resume text
  ├── ai.service.js     → 2 SenseNova API calls (assessment + questions/plan)
  ├── Zod validation    → ensures model output matches the schema
  └── InterviewReportModel.create(...)  → MongoDB Atlas
  │
  ▼
201 { message, report }  ──►  ReportResults.jsx renders it
```

**Token-based auth (not cookies).** The JWT is returned in the login/register response body, stored in `localStorage`, and sent on every request as `Authorization: Bearer <token>`. This avoids cross-site cookie blocking between the two Vercel domains. A `token` cookie is still accepted as a fallback for older sessions.

**Serverless-safe MongoDB.** Connections are cached in `global.mongoose` (`src/config/database.js`) so a cold start does not open a new connection per request.

---

## 3. Report Generation — Step by Step

| # | What happens | Where |
|---|---|---|
| 1 | User enters a job description and self-description, drops a PDF resume | `features/reports/pages/ReportGenerationPage.jsx` |
| 2 | File validated client-side (PDF, ≤ 10 MB) | `features/reports/utils/resume.js` → `validateResumeFile()` |
| 3 | All three inputs required before submission | `ReportGenerationPage.handleSubmit()` |
| 4 | Submit button enters loading state and is disabled (prevents duplicates) | `ReportGenerationPage` |
| 5 | Inputs packed into `FormData` with exact backend field names | `report.api.js` → `buildGenerateFormData()` |
| 6 | `POST /api/interview` sent; axios interceptor attaches Bearer token | `lib/api.js` |
| 7 | Express checks CORS and verifies the JWT | `app.js`, `middlewares/auth.middleware.js` |
| 8 | Multer accepts the `resume` file (PDF only, ≤ 10 MB, memory storage) | `middlewares/file.middleware.js` |
| 9 | Controller validates text fields and extracts PDF text | `controllers/interview.controller.js` |
| 10 | **Part 1** — SenseNova writes the assessment (match score, strengths, gaps…) | `services/ai.service.js` |
| 11 | **Part 2** — SenseNova writes the interview questions and preparation plan | `services/ai.service.js` |
| 12 | Both halves validated with Zod against `fullReportZodSchema` | `services/ai.service.js` |
| 13 | Report saved to MongoDB against the signed-in user | `models/interviewReport.model.js` |
| 14 | `201 { message, report }` returned | controller |
| 15 | Response validated; report stored in state; page scrolls to result | `report.api.js`, `ReportGenerationPage` |
| 16 | Report rendered section by section | `features/reports/components/ReportResults.jsx` |
| 17 | Saved report also appears in "Your Reports" and the Report Studio | `GET /api/interview`, `GET /api/interview/:id` |

> **Field names are a contract — rename one side only and the integration breaks.**
> `resume` · `jobDescription` · `selfDescription` appear in `report.api.js`
> and `interview.routes.js` / `interview.controller.js`. `report.api.test.js` locks this down.

---

## 4. API Reference

### Auth — `/api/auth`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{ username, email, password }` | `201 { message, token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `200 { message, token, user }` |
| GET | `/api/auth/logout` | – | `200 { message }`, token blacklisted |
| GET | `/api/auth/get-me` | – | `200 { message, user }` *(private)* |

Private routes require:

```
Authorization: Bearer <token>
```

JWTs expire after **7 days**. `logout` blacklists the token so a copied token cannot be reused after signing out.

---

### Reports — `/api/interview` *(all private)*

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/interview` | multipart: `resume` (PDF), `jobDescription`, `selfDescription` | `201 { message, report }` |
| GET | `/api/interview` | – | `200 { message, count, reports[] }` *(summary fields only)* |
| GET | `/api/interview/:id` | – | `200 { message, report }` *(full report)* |
| DELETE | `/api/interview/:id` | – | `200 { message }` |

### Status

| Method | Path | Returns |
|---|---|---|
| GET | `/` | `200 { status, message, version, endpoints }` |
| GET | `/api/status` | same health payload |

**Request example**

```bash
curl -X POST http://localhost:3000/api/interview \
  -H "Authorization: Bearer $TOKEN" \
  -F "resume=@/path/to/resume.pdf;type=application/pdf" \
  -F "jobDescription=<job.txt" \
  -F "selfDescription=<self.txt"
```

**Response shape**

```jsonc
{
  "message": "Interview report generated successfully.",
  "report": {
    "candidateName": "…",
    "targetRole": "Senior Frontend Engineer (React)",
    "matchScore": 72,
    "hiringRecommendation": "Proceed to Technical Interview",
    "executiveSummary": "…",
    "keyStrengths": ["…"],
    "areasForGrowth": [
      { "skill": "TypeScript", "severity": "high", "explanation": "…", "recommendation": "…" }
    ],
    "skillsAnalysis": [
      { "skill": "React.js", "importance": "required", "alignment": "strong", "evidence": "…", "assessment": "…" }
    ],
    "interviewerFocusAreas": ["…"],
    "technicalQuestions":    [{ "question": "…", "intention": "…", "answer": "…", "difficulty": "easy", "relatedSkill": "…" }],
    "systemDesignQuestions": [ "…same shape…" ],
    "behavioralQuestions":   [ "…same shape…" ],
    "preparationPlan": [{ "day": 1, "focus": "…", "tasks": ["…"], "expectedOutcome": "…" }],
    "_id": "…", "createdAt": "…", "user": "…"
  }
}
```

> The report schema is defined in `Backend/src/models/interviewReport.model.js`, mirrored by
> the Zod schema in `ai.service.js` and the renderer in `ReportResults.jsx`.
> **Change one → change all three.**

---

## 5. File Reference

### 5.1 Backend (`Backend/`)

| File | Responsibility |
|---|---|
| `api/index.js` | **Vercel serverless entry point.** Lazily imports the DB module and Express app, awaits `connectDb()`, then delegates to `app(req, res)`. Errors return JSON — never an HTML crash page. |
| `vercel.json` | Builds `api/index.js` with `@vercel/node`; routes every path to it. |
| `server.js` | Local-only entry point. Loads `dotenv`, connects Mongo, starts Express on `PORT`, raises `server.requestTimeout` for long AI runs. |
| `.env` | Real secrets. Git-ignored — **never commit**. |
| `src/app.js` | Express wiring: CORS allowlist (`CLIENT_URL` + localhost + production frontend), `express.json`, `cookieParser`, mounts `/api/auth`, `/api/interview`, `/api/status`, health route, and a **JSON error handler**. |
| `src/config/database.js` | Mongoose connection with a `global.mongoose` cache for serverless reuse; sets DNS servers. |
| `src/middlewares/auth.middleware.js` | Reads JWT from `Authorization: Bearer …` first, falls back to `token` cookie. Checks blacklist, verifies with `JWT_SECRET`, attaches `req.user`. Returns `401 { message: "Unauthorized" }` when missing. |
| `src/middlewares/file.middleware.js` | Multer: memory storage, one file, ≤ 10 MB, **PDF-only filter**. Converts multer errors to JSON. |
| `src/controllers/auth.controller.js` | Register / login / logout / get-me. bcrypt hashing, 7-day JWT, **token returned in response body**, logout blacklists the token. |
| `src/controllers/interview.controller.js` | Validates input, extracts PDF text, calls AI service, saves the report. Also handles list / get one / delete. |
| `src/services/ai.service.js` | The AI engine. Two SenseNova (OpenAI-compatible) chat calls, truncated-JSON repair, Zod validation. |
| `src/services/ai.service.test.js` | Unit tests for the truncated-JSON repair logic. |
| `src/models/user.model.js` | User schema (username, email, hashed password). |
| `src/models/interviewReport.model.js` | Report schema — the source of truth for the report shape. |
| `src/models/blackList.model.js` | Stores logged-out (blacklisted) tokens. |
| `package.json` | `npm start` → `node server.js`, `npm test` → `node --test src`. |

**PDF parsing note.** `pdf-parse@1.1.1`'s `index.js` contains a debug block that crashes the serverless function when imported from an ES module (`module.parent` is `undefined`). The controller bypasses this:

```js
import "pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js"; // ensures Vercel bundles the asset
import pdfParse from "pdf-parse/lib/pdf-parse.js";    // bypasses the debug block
```

---

### 5.2 Frontend (`Frontend/`)

#### Entry & Routing

| File | Responsibility |
|---|---|
| `index.html` | Vite HTML shell, mounts `#root`. |
| `vite.config.js` | Vite 8 + React plugin + Tailwind v4 plugin; polling watcher enabled for Windows. |
| `src/main.jsx` | React 19 root. |
| `src/App.jsx` | Wraps the router in `AuthProvider`. |
| `src/app.routes.jsx` | `/` (landing), `/login`, `/register` (guest-only), `/app` (report generation), `/app/report-studio` (saved reports). |
| `src/index.css` | Design system: CSS tokens, type scale, buttons, form fields, dropzone, alerts, report primitives. |

#### API Layer

| File | Responsibility |
|---|---|
| `src/lib/api.js` | **The one axios instance.** Base URL from `VITE_API_URL`; long timeout (`VITE_API_TIMEOUT_MS`, default 60 min). Request interceptor attaches `Authorization: Bearer <token>` from `localStorage`. Response interceptor clears the token on `401`. `getApiErrorMessage()` converts every failure into a readable sentence. |
| `src/features/reports/services/report.api.js` | Builds the multipart body with exact field names; `generateReport`, `getReports`, `getReport`, `deleteReport`; `requireReport()` rejects malformed responses. Uses the shared axios client. |
| `src/features/reports/services/report.api.test.js` | Multipart contract unit test. |
| `src/features/auth/services/auth.api.js` | `register`, `login`, `logout`, `getMe`. Saves `response.data.token` to `localStorage`; logout always removes it. |

#### Auth Feature

| File | Responsibility |
|---|---|
| `src/features/auth/authContext.js` | React context object. |
| `src/features/auth/auth.context.jsx` | On mount: if `localStorage` has no token, stay logged out. Otherwise calls `getMe()`; on failure clears the token and user. |
| `src/features/auth/hooks/useAuth.js` | `useAuth()` → `user`, `handleLogin`, `handleRegister`, `handleLogout`. |
| `src/features/auth/components/RouteGuards.jsx` | `ProtectedRoute` / `GuestRoute`. |
| `src/features/auth/pages/Login.jsx` | Login form + redirect logic. |
| `src/features/auth/pages/Register.jsx` | Registration form. |

#### Reports Feature

| File | Responsibility |
|---|---|
| `src/features/reports/pages/ReportGenerationPage.jsx` | Main app page: inputs, validation, loading/error states, result section, "Your Reports" list. |
| `src/features/reports/pages/ReportStudioPage.jsx` | Saved-report library (browse and view past reports). |
| `src/features/reports/components/FileDropzone.jsx` | Accessible drag-and-drop PDF picker. |
| `src/features/reports/components/ReportResults.jsx` | Renders only the fields the backend returned, section by section. |
| `src/features/reports/utils/resume.js` | `validateResumeFile()` (PDF, ≤ 10 MB) and `formatFileSize()`. |
| `src/features/reports/utils/resume.test.js` | File-validation unit tests. |

#### Shared UI, Motion & Landing

| File/Directory | Responsibility |
|---|---|
| `src/components/Brand.jsx` | Logo / brand name component. |
| `src/components/Navbar.jsx` | Top navigation bar. |
| `src/components/Footer.jsx` | Site footer. |
| `src/components/AuthShell.jsx` | Wrapper layout for login/register pages. |
| `src/components/ReportSheet.jsx` | Sample report card used on the landing page. |
| `src/components/ReportPreview.jsx` | Report preview component for the landing page. |
| `src/components/ChromaGrid.jsx` + `.css` | Animated chroma-grid visual effect used as a background element. |
| `src/components/TechText.jsx` + `.css` | Typewriter / tech-text reveal animation component. |
| `src/components/Loading.jsx` | Full-screen loading indicator. |
| `src/components/Toast.jsx` | Toast / notification component. |
| `src/components/Reveal.jsx` | Scroll-reveal wrapper (anime.js powered). |
| `src/animations/` | anime.js helper hooks: `useEntrance`, `useScrollReveal`, `useButtonMotion`, `useMaskedLines`, `useSpin`, `animationConfig`, `animationUtils`. |
| `src/hooks/useToast.js` | Toast state manager hook. |
| `src/pages/LandingPage.jsx` | Public marketing / landing page. |
| `src/data/reports.js` | **Sample data only** — used by landing page components; not part of the report generation flow. |
| `Frontend/design.md` | Design specification for the Spotifast-inspired UI redesign. |

---

### 5.3 Verification Tools (`tools/`)

Plain Node scripts — no test framework required.

| Script | What it does |
|---|---|
| `tools/apitest.mjs` | Registers a throwaway user, uploads a PDF, prints the report, checks negative cases. |
| `tools/list-reports.mjs` | Logs in and lists / fetches saved reports. |
| `tools/ui-states.mjs` | Playwright: empty-form and file-type validation, loading state checks. |
| `tools/e2e.mjs` | Playwright: full register → upload → report flow. |
| `tools/error-states.mjs` | Playwright: network / server / malformed-response error paths. |
| `tools/studio-check.mjs` | Report Studio inspection helper. |
| `tools/db-inspect.mjs` | MongoDB database inspection helper. |

---

## 6. Deployment (Vercel)

### Backend

1. Vercel project → **Root Directory = `Backend`**.
2. Framework preset: **Other** (relies on `vercel.json`).
3. Build/output handled by `vercel.json` (`api/index.js` via `@vercel/node`).
4. Environment variables (**Settings → Environment Variables**, all environments):

| Name | Required | Notes |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string. |
| `JWT_SECRET` | ✅ | Long random string; changing it invalidates all sessions. |
| `NODE_ENV` | ✅ | Set to `production`. |
| `SENSENOVA_API_KEY` | ✅ | AI provider key. |
| `SENSENOVA_MODEL` | optional | Default: `sensenova-6.8-flash-lite`. |
| `SENSENOVA_BASE_URL` | optional | Default: `https://token.sensenova.ai/v1`. |
| `CLIENT_URL` | optional | Extra CORS origins, comma-separated. |

> `.env` files are **not** read by Vercel functions. Variables must be set in the Vercel dashboard.
> Log lines like `injected env (0) from .env` are normal — they don't mean dashboard variables are missing.

### Frontend

1. Vercel project → **Root Directory = `Frontend`**.
2. Environment variable:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://gen-ai-by-hassnain.vercel.app` *(no trailing slash)* |

3. Redeploy after adding or changing variables (Vite inlines them at build time).

### Post-Deploy Smoke Test

1. `GET https://gen-ai-by-hassnain.vercel.app/` → JSON with `"status": "ok"`.
2. Login → response contains `token`; DevTools → Application → Local Storage shows `token`.
3. Refresh → `GET /api/auth/get-me` has `Authorization: Bearer …` and returns `200`.
4. PDF upload → `201` with a full report.
5. Logout → `token` removed from Local Storage; protected routes return `401`.

---

## 7. Debugging Playbook

### Vercel returns `500 FUNCTION_INVOCATION_FAILED`

Check **Runtime Logs** first — the stack trace names the file.

| Log snippet | Cause | Fix |
|---|---|---|
| `ENOENT … test/data/05-versions-space.pdf` | `pdf-parse` debug block ran on ESM import | Already fixed: imports `pdf-parse/lib/pdf-parse.js` directly |
| `DOMMatrix is not defined` | old top-level `pdfjs-dist` import | Not used — text extraction goes through `pdf-parse` |
| `Missing parameter name at index 1: *` | `app.options("*", …)` on Express 5 | Already removed; `app.use(cors())` handles preflight |
| `MONGO_URI is missing` | env var not set in Vercel | Add in the dashboard and redeploy |
| `Cannot find module …` | dependency not installed / not traced | Check `package.json`, redeploy without build cache |

### The request never leaves the browser

DevTools → Network → filter `interview`. No row → client validation blocked it.

### `Network error` / "Could not reach the GEN+AI server"

```bash
curl -i https://gen-ai-by-hassnain.vercel.app/   # expect 200 JSON
```

- Backend down → check the Vercel deployment.
- Wrong base URL → check `VITE_API_URL` and redeploy.
- **CORS** → the request origin must be in the allowlist (`Backend/src/app.js`). Inspect `Access-Control-Allow-Origin` in the Network tab.

### `401 Unauthorized`

- No token in `localStorage` → log in again.
- Request missing `Authorization: Bearer …` → confirm the interceptor in `lib/api.js`; confirm the key is exactly `"token"`.
- Token expired (7 days) or blacklisted after logout → log in again.
- `JWT_SECRET` changed on Vercel → all old tokens are invalid.

### `400` on PDF upload

| Message | Cause |
|---|---|
| `Please upload your resume as a PDF file.` | No file in the `resume` field |
| `The resume must be a PDF file.` | Wrong MIME type or extension |
| `The resume must be smaller than 10 MB.` | File too large |
| `Failed to parse PDF file…` | Corrupt or password-protected PDF |
| `PDF mein readable text nahi mila…` | Scanned PDF without a text layer |

### `500 Failed to generate interview report.`

The AI step failed. Watch the function logs:

- `SENSENOVA_API_KEY is not configured` → set the key in Vercel.
- Provider HTTP error → key invalid/quota exceeded, or `SENSENOVA_BASE_URL` is wrong.
- Zod error → the model returned JSON that doesn't match the schema; the log names the field.

### Where to look first

| Symptom | File |
|---|---|
| Form sends nothing | `features/reports/pages/ReportGenerationPage.jsx` |
| Wrong field names / body shape | `features/reports/services/report.api.js` |
| Base URL, token header, error text | `src/lib/api.js` |
| Report not displayed | `features/reports/components/ReportResults.jsx` |
| Auth / session problems | `Backend/src/middlewares/auth.middleware.js`, `auth.controller.js` |
| Upload rejected | `Backend/src/middlewares/file.middleware.js` |
| PDF parse errors | `Backend/src/controllers/interview.controller.js` |
| AI output / schema mismatch | `Backend/src/services/ai.service.js` |
| Saved report shape | `Backend/src/models/interviewReport.model.js` |
| CORS / JSON errors | `Backend/src/app.js` |
| Serverless cold start | `Backend/api/index.js` |

---

## 8. Environment Variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `PORT` | Backend | `3000` | Local server port (ignored on Vercel). |
| `NODE_ENV` | Backend | `development` | Set to `production` on Vercel. |
| `MONGO_URI` | Backend | – | MongoDB connection string (**required**). |
| `JWT_SECRET` | Backend | – | Signs JWTs (**required**). |
| `CLIENT_URL` | Backend | – | Extra CORS origins, comma-separated. |
| `SENSENOVA_API_KEY` | Backend | – | AI provider key (**required**). |
| `SENSENOVA_MODEL` | Backend | `sensenova-6.8-flash-lite` | Model used for both AI passes. |
| `SENSENOVA_BASE_URL` | Backend | `https://token.sensenova.ai/v1` | OpenAI-compatible base URL. |
| `VITE_API_URL` | Frontend | `http://localhost:3000` | Backend base URL (inlined at build time). |
| `VITE_API_TIMEOUT_MS` | Frontend | `3600000` | Axios timeout for report generation (ms). |

No secret ever reaches the frontend bundle. The browser holds only a JWT in `localStorage`.

---

## 9. Security Notes

- `.env` files are git-ignored. **Never commit real keys.**
- If a secret was ever committed, **rotate it immediately**: MongoDB password, `JWT_SECRET`, `SENSENOVA_API_KEY`.
- `localStorage` is used because cross-site cookies were blocked between the two Vercel domains. It is readable by JavaScript, so keep XSS out of the app.
- JWTs are **blacklisted on logout** — a copied token cannot be reused after signing out.

---

## 10. Known Limitations

- **Text-based PDFs only.** A scanned resume (image-only PDF) produces a clear "no readable text" message.
- **No streaming / progress.** The client waits for the full HTTP response (up to 60 minutes by default). There is no progress indicator, streaming, or cancel button during generation.
- **Provider quota & latency.** Report quality and speed depend entirely on SenseNova availability; failures surface as a readable `500`.
- **Serverless time limits.** Very large PDFs or slow AI runs can hit Vercel's function execution limits.
- **Landing page sample data.** `Frontend/src/data/reports.js` and `ReportSheet.jsx` / `ReportPreview.jsx` use hardcoded sample data for the public landing page only — they are not part of the live generation flow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | React 19 |
| **Build tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Animations** | anime.js v4 |
| **HTTP client** | axios |
| **Icons** | lucide-react |
| **Routing** | React Router v8 |
| **Backend framework** | Express 5 |
| **Database** | MongoDB + Mongoose 9 |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **File upload** | multer v2 |
| **PDF extraction** | pdf-parse |
| **AI provider** | SenseNova (OpenAI-compatible API) |
| **Schema validation** | Zod v4 |
| **Deployment** | Vercel (serverless functions) |
| **E2E / browser testing** | Playwright |
