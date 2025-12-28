# Smart Scheduler — Step-by-step free-tier deployment (Dec 2025)

This repo is a **3-service app**:

- **Frontend**: React (CRA) in `frontend/`
- **Backend API**: Node/Express in `backend/`
- **Timetable generator**: FastAPI (Python) in `api/python/`
- **Database**: MongoDB (recommended: MongoDB Atlas free tier)

Important reality check:

- “Permanent free hosting” can’t be guaranteed by any company; free tiers, quotas, and policies can change.
- Many free backends **sleep** when inactive (cold start). That’s normal on free tiers.

This guide uses a very common $0 stack:

- MongoDB Atlas (free DB)
- Render (popular for simple deploys; free tiers may sleep)
- Cloudflare Pages (popular for static frontends)

If you prefer a different host, the same env vars + commands still apply.

---

## 0) One-time prerequisites (do this first)

1) Put the project on GitHub

- Create a GitHub account.
- Create a new repository (private or public).
- From your project folder, push code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

2) Decide your final URLs (examples)

- Frontend: `https://smart-scheduler.com`
- Backend: `https://smart-scheduler-backend.com`
- Python: `https://smart-scheduler-py-api.com`

---

## 1) Create the free MongoDB Atlas database

1) Go to MongoDB Atlas and create a **Free (M0)** cluster.
2) Create a database user + password.
3) Network Access:

- Easiest for first deploy: allow `0.0.0.0/0`.
- Later, tighten it by allowing only your backend’s outbound IPs (if your host provides them).

4) Copy the connection string and keep it ready as `MONGODB_URI`.

---

## 2) Deploy the Python FastAPI service (Render)

Goal: get a public Python URL you can paste into `PY_API_URL` for the backend.

1) Open Render → **New** → **Web Service**.
2) Connect your GitHub repo.
3) Settings:

- **Name**: `smart-scheduler-py` (anything)
- **Root Directory**: `api/python`
- **Runtime**: Python
- **Build Command**:

```bash
pip install -r requirements.txt
```

- **Start Command**:

```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

4) Click **Create Web Service**.
5) Wait until it shows “Live”, then copy the URL:

- Example: `https://smart-scheduler-py.onrender.com`

Keep this URL; you’ll use it in the backend as `PY_API_URL`.

---

## 3) Deploy the Node/Express backend (Render)

Goal: get a public backend API URL for the frontend (`REACT_APP_API_URL`).

1) Render → **New** → **Web Service**.
2) Pick the same GitHub repo.
3) Settings:

- **Name**: `smart-scheduler-api`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**:

```bash
npm ci
```

- **Start Command**:

```bash
npm start
```

4) Add **Environment Variables** (very important)

Minimum required:

- `NODE_ENV=production`
- `MONGODB_URI=<your Atlas connection string>`
- `FRONTEND_URL=<temporary placeholder for now>`
  - You can set it later to your real frontend URL after you deploy the frontend.
- `SESSION_SECRET=<long random string>`
- `JWT_SECRET=<long random string>`
- `JWT_EXPIRE=7d`
- `PY_API_URL=https://smart-scheduler-py.onrender.com` (your Python URL)

Optional (only if you use these features):

- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY`
- Email SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

5) Create the service and wait until it is live.
6) Test it:

- Open: `https://<your-backend>/api/health`
- You should get JSON: `{ status: "Server is running", ... }`

---

## 4) Deploy the React frontend (Cloudflare Pages)

Goal: publish the UI and point it at the backend API.

1) Cloudflare → **Pages** → **Create a project** → connect GitHub repo.
2) Build settings:

- **Root directory**: `frontend`
- **Build command**:

```bash
npm ci && npm run build
```

- **Build output directory**: `build`

3) Add **Environment variables** (build-time):

- `REACT_APP_API_URL=https://<your-backend>`

4) Deploy.
5) SPA routing (React Router)

If you see 404s when refreshing a route like `/admin/dashboard`, add a SPA fallback:

- Create `frontend/public/_redirects` with:

```
/* /index.html 200
```

Then redeploy.

---

## 5) Final wiring (very important)

Now that you have the real frontend URL, update the backend:

1) In Render (backend service) set:

- `FRONTEND_URL=https://<your-frontend>`

2) Redeploy the backend service.

This fixes:

- CORS (browser can call API)
- OAuth redirects (if enabled)
- Stripe success/cancel URLs (if enabled)

---

## 6) Google OAuth setup (optional)

Only do this if you want “Login with Google”.

1) In Google Cloud Console → OAuth Client:

- **Authorized redirect URI** must be exactly:
  - `https://<your-backend>/api/auth/google/callback`

2) In Render (backend env vars), set:

- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_CALLBACK_URL=https://<your-backend>/api/auth/google/callback`

3) Redeploy backend.

---

## 7) Stripe webhooks (optional)

Webhook endpoint is:

- `POST https://<your-backend>/api/payments/webhook`

Note:

- Sleeping free services can delay webhook delivery; Stripe retries, but for production payments a paid “always on” backend is recommended.

---

## 8) Final checklist

Open these in your browser:

- Frontend loads: `https://<your-frontend>`
- Backend health: `https://<your-backend>/api/health`

In the UI:

- Register institute (owner)
- Login as admin/user
- Create time slots
- Generate timetable (this confirms backend → python works)

---

## Local dev reminder

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- Python: `http://localhost:8000`

Dev note:

- If `REACT_APP_API_URL` is not set, requests stay relative and CRA dev proxy can be used.

