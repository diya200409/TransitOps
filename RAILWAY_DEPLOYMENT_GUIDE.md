# 🚂 Deploying TransitOps on Railway — Complete Guide

Your repository is now **100% configured and optimized for Railway** (`railway.app`). Railway can host your **PostgreSQL Database**, **FastAPI Backend**, and **React (Vite) Frontend** all in a single project with zero sleep issues!

---

## 🏗️ What We Auto-Configured for You

1. **Backend Subdirectory Support (`transitops-backend/railway.toml`)**:
   - Nixpacks builder configured with `pip install -r requirements.txt`.
   - Start command explicitly set to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   - **Auto-Seeding**: When the backend boots, it checks if the database is empty. If no users exist, it automatically runs `seed.py` to pre-load all demo data (Fleet Manager user, vehicles, trips, maintenance, analytics).

2. **Frontend Subdirectory Support (`frontend/railway.toml` & `package.json`)**:
   - Nixpacks builder configured with `npm install && npm run build`.
   - Start command explicitly set to `npx serve -s dist -l $PORT`.
   - The `-s` flag enables Single Page Application (SPA) fallback, routing all URLs to `index.html` so page refreshes never return 404s.

3. **Universal CORS & Origin Regex (`app/main.py`)**:
   - Upgraded CORS handling to automatically allow any `*.up.railway.app`, `*.vercel.app`, or exact origins without browser credential rejection errors.

---

## 🚀 Deployment Step-by-Step (Via Railway Dashboard)

### Step 1: Push Changes to GitHub
Commit and push the configuration changes we just made:
```bash
git add -A
git commit -m "Configure Railway deployment for backend and frontend"
git push origin main
```

### Step 2: Create a Railway Project & Database
1. Go to [railway.app](https://railway.app) and click **New Project**.
2. Select **Provision PostgreSQL** (this adds a PostgreSQL database to your canvas).

### Step 3: Add the Backend Service
1. In the same Railway project canvas, click **+ New** → **GitHub Repo** → select `diya200409/TransitOps` (or your repository).
2. Click on the newly created service card and go to the **Settings** tab.
3. Scroll down to **Root Directory** and change it to:
   ```text
   transitops-backend
   ```
4. Go to the **Variables** tab on this service and click **New Variable** (or **Add Reference**):
   - `DATABASE_URL` → Click **Add Reference** → select `${{Postgres.DATABASE_URL}}`
   - `TRANSITOPS_SECRET_KEY` → Enter a secure random string (or let Railway generate one via `${{RAILWAY_STATIC_URL}}`)
   - `PORT` → `8000` (Optional; Railway automatically injects `$PORT`)
5. Go to the **Settings** tab → **Networking** → click **Generate Domain** (e.g. `https://transitops-backend-production.up.railway.app`).
6. Your backend will now deploy! When complete, it automatically creates the database tables and seeds demo data.

### Step 4: Add the Frontend Service
1. In the same Railway project canvas, click **+ New** → **GitHub Repo** → select `diya200409/TransitOps` again.
2. Click on this second service card and go to the **Settings** tab.
3. Scroll down to **Root Directory** and change it to:
   ```text
   frontend
   ```
4. Go to the **Variables** tab on the frontend service and add:
   - `VITE_API_BASE_URL` → The domain you generated for your backend in Step 3.5 (e.g., `https://transitops-backend-production.up.railway.app`)
5. Go to **Settings** → **Networking** → click **Generate Domain** (e.g. `https://transitops-frontend-production.up.railway.app`).
6. Your frontend will build (`npm run build`) and launch!

---

## 🎯 Testing Your Live App

1. Open your Frontend Railway URL (`https://transitops-frontend-production.up.railway.app`).
2. Log in with the pre-seeded demo credentials:
   - **Email:** `fleetmanager@transitops.com`
   - **Password:** `password123`

---

## ⚡ Alternative: Deploying via Railway CLI

If you prefer deploying directly from your terminal using the installed Railway CLI (`v5.0.0`):

```bash
# 1. Login to your Railway account
railway login

# 2. Link or create a project
railway init

# 3. Add PostgreSQL plugin
railway add --plugin postgresql

# 4. Deploy Backend from transitops-backend folder
cd transitops-backend
railway up

# 5. Deploy Frontend from frontend folder
cd ../frontend
railway up
```
