# Deployment Guide — GEN+AI (Frontend + Backend on Separate Vercel Projects)

This project is deployed as **two independent Vercel projects**:

| Project | Directory | Framework | Build Output |
|---------|-----------|-----------|--------------|
| Frontend | `Frontend/` | React 19 + Vite | `dist/` |
| Backend | `Backend/` | Express 5 (serverless) | N/A (serverless functions) |

---

## 1. Frontend Vercel Project

**Root Directory:** `Frontend/`

**Build & Output Settings (in Vercel dashboard):**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Development Command: `npm run dev`

### Environment Variables (Frontend)

| Variable | Required | Value | Public/Secret |
|----------|----------|-------|---------------|
| `VITE_API_URL` | Yes | `https://your-backend.vercel.app` | Public (browser) |

**Do not put backend secrets (MONGO_URI, JWT_SECRET, API keys) in frontend configuration.**

### How the frontend finds the backend

`Frontend/src/lib/api.js` reads `VITE_API_URL` at build time and uses it as the axios `baseURL`. In production, if `VITE_API_URL` is missing, the build will fail with a clear error — it will never silently fall back to `localhost`.

---

## 2. Backend Vercel Project

**Root Directory:** `Backend/`

**Build & Output Settings (in Vercel dashboard):**
- Build Command: `npm install` (no build step needed for Express serverless)
- Output Directory: (not applicable — serverless functions)
- Development Command: `npm run dev`
- Production Start Command: `npm start` (`node server.js`)

### Environment Variables (Backend)

| Variable | Required | Example Value | Secret? |
|----------|----------|---------------|---------|
| `MONGO_URI` | Yes | `mongodb+srv://...` | Yes |
| `JWT_SECRET` | Yes | long random string | Yes |
| `CLIENT_URL` / `FRONTEND_URL` | Yes | `https://your-frontend.vercel.app` | No |
| `PORT` | No | `3000` | No |
| `NODE_ENV` | No | `production` | No |
| `SENSENOVA_API_KEY` | No (Ollama fallback) | `sk-...` | Yes |
| `SENSENOVA_BASE_URL` | No | `https://token.sensenova.ai/v1` | No |
| `SENSENOVA_MODEL` | No | `sensenova-6.8-flash-lite` | No |
| `OLLAMA_URL` | No | `http://127.0.0.1:11434` | No |
| `OLLAMA_MODEL` | No | `qwen2.5:7b` | No |
| `OLLAMA_NUM_CTX` | No | `8192` | No |
| `OLLAMA_NUM_PREDICT` | No | `4096` | No |
| `MAX_RESUME_MB` | No | `4` (serverless limit ~4.5 MB) | No |

**CLIENT_URL vs FRONTEND_URL:** `FRONTEND_URL` is the canonical name. `CLIENT_URL` is kept as a backwards-compatible alias. Both accept comma-separated values for multiple origins.

**Secret variables** (`MONGO_URI`, `JWT_SECRET`, `SENSENOVA_API_KEY`) must be set in the Vercel dashboard under **Settings → Environment Variables**. Never commit `.env` files.

---

## 3. Step-by-Step Deployment

### Frontend

1. In Vercel, click **"Add New Project"**.
2. Import your repository.
3. Set **Root Directory** to `frontend`.
4. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend.vercel.app` (your deployed backend URL)
6. Click **Deploy**.

### Backend

1. In Vercel, click **"Add New Project"**.
2. Import your repository.
3. Set **Root Directory** to `Backend`.
4. Add all required environment variables (see table above).
5. Click **Deploy**.

### After Deployment

1. Copy the frontend Vercel URL (e.g. `https://gen-ai-by-hassnain-qs5d.vercel.app`).
2. Copy the backend Vercel URL (e.g. `https://gen-ai-by-hassnain-tau.vercel.app`).
3. In the **Backend** project settings, set `CLIENT_URL` (or `FRONTEND_URL`) to the frontend URL.
4. In the **Frontend** project settings, set `VITE_API_URL` to the backend URL.
5. Redeploy both projects.

---

## 4. Updating Deployment URLs (No Code Changes)

If you change your frontend or backend domain (e.g. adding a custom domain):

1. **Frontend URL changes:** Update `CLIENT_URL` / `FRONTEND_URL` in the **Backend** Vercel project settings → Redeploy backend.
2. **Backend URL changes:** Update `VITE_API_URL` in the **Frontend** Vercel project settings → Redeploy frontend.
3. No source code changes are ever needed when URLs change — all URLs are environment-driven.

---

## 5. Authentication & Cookies (Cross-Origin)

The backend issues an `httpOnly` cookie named `token`. For cross-origin frontend/backend on separate Vercel domains:

- `secure: true` in production (HTTPS only)
- `sameSite: "none"` in production (required for cross-site cookies)
- `path: "/"` (accessible from all routes)
- `httpOnly: true` (JavaScript cannot read it)

The frontend sends credentials automatically via `withCredentials: true` in the axios client (`src/lib/api.js`).

**Important:** Browsers restrict third-party cookies. Test login/logout flow in production after deployment.

---

## 6. Local Development

### Backend

```bash
cd Backend
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, CLIENT_URL
npm run dev            # nodemon server.js on port 3000
```

### Frontend

```bash
cd Frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm run dev            # Vite dev server on port 5173
```

### Running Tests

```bash
# Frontend
cd Frontend
npm run lint           # ESLint
npm test               # 7 unit tests
npm run build          # Production build

# Backend
cd Backend
npm test               # 6 unit tests
```

---

## 7. Production Limitations

| Limitation | Details |
|------------|---------|
| Serverless timeout | Vercel serverless functions have a timeout (hobby: 10s, pro: up to 900s). Report generation can take minutes. Set `maxDuration` if on a paid plan. |
| File storage | Multer uses `memoryStorage` — files are held in RAM, not written to disk. This works on serverless. Request body is limited (~4.5 MB on serverless). Set `MAX_RESUME_MB=4` on Vercel. |
| MongoDB | Use MongoDB Atlas or another cloud-hosted MongoDB. Local MongoDB won't be reachable from Vercel. |
| AI provider | SenseNova (cloud) works on serverless. Ollama (local) does not work on Vercel — it requires a local machine. |

---

## 8. File Summary

### Created
- `Frontend/vercel.json` — SPA fallback for React Router
- `Backend/vercel.json` — Express serverless function config
- `DEPLOYMENT.md` — This document

### Modified
- `Frontend/.gitignore` — Added `.env`, `.env.local`, `.env.*.local`
- `Frontend/.env` — Production `VITE_API_URL`
- `Frontend/.env.example` — Documented production variable
- `Frontend/.env.production` — Production `VITE_API_URL`
- `Frontend/src/lib/api.js` — Production validation for `VITE_API_URL`
- `Backend/.env` — Added frontend URL to `CLIENT_URL`
- `Backend/.env.example` — Documented `FRONTEND_URL` / `CLIENT_URL`
- `Backend/server.js` — Startup env validation (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`)
- `Backend/src/app.js` — CORS: `FRONTEND_URL` canonical, loopback only in dev, trailing-slash normalization
- `Backend/src/controllers/auth.controller.js` — Cookie `secure`/`sameSite`/`path` env-driven for production
- `Backend/package.json` — `start` script: `nodemon` → `node` (production-safe)

### Removed
- Root `vercel.json` — Not needed for separate frontend/backend deployments
