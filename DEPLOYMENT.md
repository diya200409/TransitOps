# 🚀 TransitOps Deployment Guide

Complete guide to deploy TransitOps to production using free hosting services.

---

## 📋 Table of Contents

1. [Quick Deploy (Recommended)](#quick-deploy-recommended)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Post-Deployment Steps](#post-deployment-steps)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Deploy (Recommended)

### **Option 1: Render (Backend) + Vercel (Frontend)**

This is the easiest and most reliable option for beginners.

#### **Step 1: Deploy Backend to Render**

1. **Sign up** at [render.com](https://render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create:
   - PostgreSQL database
   - Backend API service
5. Wait 5-10 minutes for deployment
6. Copy your API URL: `https://transitops-api.onrender.com`

#### **Step 2: Deploy Frontend to Vercel**

1. **Sign up** at [vercel.com](https://vercel.com)
2. Click **"Import Project"**
3. Select your TransitOps repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   ```
   VITE_API_BASE_URL=https://transitops-api.onrender.com
   ```
6. Click **"Deploy"**
7. Your app will be live at: `https://transitops.vercel.app`

#### **Step 3: Update Backend CORS**

In Render dashboard:
1. Go to your backend service
2. Add environment variable:
   ```
   TRANSITOPS_CORS_ORIGINS=https://transitops.vercel.app
   ```
3. Save and redeploy

✅ **Done!** Your app is now live!

---

### **Option 2: Railway (Backend + Frontend)**

Railway can host both frontend and backend in one place.

#### **Deploy Backend**

1. **Sign up** at [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select TransitOps repository
4. Railway will detect `railway.json`
5. Add PostgreSQL:
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
6. Add Environment Variables:
   ```
   TRANSITOPS_SECRET_KEY=<generate-random-key>
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   TRANSITOPS_CORS_ORIGINS=https://transitops-production.up.railway.app
   ```
7. Deploy and copy URL

#### **Deploy Frontend**

1. In same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select TransitOps again
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`
4. Add Environment Variable:
   ```
   VITE_API_BASE_URL=<your-backend-url>
   ```
5. Deploy

---

## 🔧 Backend Deployment

### **Requirements**
- PostgreSQL database (SQLite won't work in production)
- Python 3.11+
- Environment variables configured

### **Render.com (Free - Recommended)**

**Pros**: Free PostgreSQL, automatic SSL, easy setup  
**Cons**: Sleeps after 15 min inactivity (wakes on request)

**Setup:**
```bash
# Already configured via render.yaml
# Just connect GitHub and deploy!
```

**Environment Variables Required:**
```bash
TRANSITOPS_SECRET_KEY=your-secret-key-min-32-chars
DATABASE_URL=postgresql://user:pass@host:5432/dbname
TRANSITOPS_CORS_ORIGINS=https://your-frontend-url.com
```

**Seed Database (One-time):**
```bash
# In Render Shell:
cd transitops-backend
python seed.py
```

---

### **Railway.app (Free)**

**Pros**: No sleep, fast builds, great DX  
**Cons**: $5 free credit per month (usually enough)

**Setup:**
```bash
# Connect GitHub repo
# Add PostgreSQL plugin
# Set environment variables (see above)
```

**Database Migration:**
```bash
# In Railway Shell:
cd transitops-backend
alembic upgrade head
python seed.py
```

---

### **Heroku (Free tier deprecated)**

If you still have Heroku access:

```bash
heroku create transitops-api
heroku addons:create heroku-postgresql:mini
heroku config:set TRANSITOPS_SECRET_KEY=$(openssl rand -hex 32)
git subtree push --prefix transitops-backend heroku main
```

---

## 🎨 Frontend Deployment

### **Vercel (Free - Recommended)**

**Pros**: Instant deployment, automatic SSL, CDN  
**Cons**: None for static sites

**Manual Deploy:**
```bash
cd frontend
npm install
npm run build

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**GitHub Integration:**
- Push to GitHub → Auto-deploys!

---

### **Netlify (Free)**

**Pros**: Similar to Vercel, drag-n-drop option  
**Cons**: Slightly slower builds

**Deploy:**
```bash
cd frontend
npm run build

# Drag dist/ folder to Netlify dashboard
# OR use CLI:
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**Configuration:**
Already set up in `netlify.toml`

---

### **Cloudflare Pages (Free)**

**Pros**: Fastest CDN, unlimited bandwidth  
**Cons**: Slightly complex setup

**Setup:**
1. Connect GitHub repo
2. Set build settings:
   - **Framework**: Vite
   - **Build command**: `cd frontend && npm run build`
   - **Output**: `frontend/dist`
3. Add env var: `VITE_API_BASE_URL`

---

## ⚙️ Environment Configuration

### **Backend Environment Variables**

**Required:**
```bash
TRANSITOPS_SECRET_KEY=<random-32-char-string>
DATABASE_URL=postgresql://user:pass@host:5432/dbname
TRANSITOPS_CORS_ORIGINS=https://your-frontend.com
```

**Optional:**
```bash
TRANSITOPS_JWT_ALGORITHM=HS256
TRANSITOPS_ACCESS_TOKEN_EXPIRE_HOURS=12
TRANSITOPS_SMTP_HOST=smtp.gmail.com
TRANSITOPS_SMTP_PORT=587
TRANSITOPS_SMTP_USER=your-email@gmail.com
TRANSITOPS_SMTP_PASSWORD=your-app-password
TRANSITOPS_SMTP_FROM=noreply@transitops.com
```

**Generate Secret Key:**
```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -hex 32
```

---

### **Frontend Environment Variables**

```bash
VITE_API_BASE_URL=https://your-backend-api.com
```

**Important:** Update this to your actual backend URL after deployment!

---

## 📝 Post-Deployment Steps

### **1. Update CORS Settings**

In your backend environment variables:
```bash
TRANSITOPS_CORS_ORIGINS=https://your-frontend.vercel.app,https://www.yourdomain.com
```

### **2. Seed Database**

**Render:**
```bash
# Go to Render dashboard → Shell
cd transitops-backend
python seed.py
```

**Railway:**
```bash
# In Railway terminal
cd transitops-backend
python seed.py
```

### **3. Test Demo Login**

Visit your frontend URL and login with:
```
Email: fleetmanager@transitops.com
Password: password123
```

### **4. Run Database Migrations**

```bash
cd transitops-backend
alembic upgrade head
```

### **5. Set Up Custom Domain (Optional)**

**Vercel:**
- Dashboard → Settings → Domains → Add Domain

**Render:**
- Dashboard → Settings → Custom Domains

### **6. Enable SSL (Automatic)**

Both Vercel and Render provide free SSL certificates automatically!

---

## 🔍 Troubleshooting

### **CORS Errors**

**Symptom:** "Failed to fetch" or CORS policy errors

**Solution:**
1. Check `TRANSITOPS_CORS_ORIGINS` includes your frontend URL
2. Ensure URL doesn't have trailing slash
3. Restart backend service

---

### **Database Connection Failed**

**Symptom:** `sqlalchemy.exc.OperationalError`

**Solution:**
1. Verify `DATABASE_URL` is set correctly
2. Check PostgreSQL database is running
3. Ensure format: `postgresql://user:pass@host:5432/dbname`

---

### **Login Not Working**

**Symptom:** 401 Unauthorized or token errors

**Solution:**
1. Check `TRANSITOPS_SECRET_KEY` is set
2. Clear browser cookies/localStorage
3. Verify backend is running: visit `/docs`

---

### **Backend Sleeping (Render)**

**Symptom:** First request takes 30+ seconds

**Solution:**
- Free tier sleeps after 15 min inactivity
- Consider upgrading to paid tier ($7/mo)
- OR use Railway (no sleep)

---

### **Build Fails**

**Frontend Build Error:**
```bash
# Check Node version (need 18+)
# Clear cache:
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Backend Build Error:**
```bash
# Check Python version (need 3.11+)
# Verify requirements.txt exists
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📊 Deployment Checklist

Before going live:

- [ ] Backend deployed with PostgreSQL
- [ ] Frontend deployed with correct API URL
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Database seeded with demo data
- [ ] Test login with demo credentials
- [ ] SSL certificate active (auto)
- [ ] Custom domain configured (optional)
- [ ] Email alerts configured (optional)
- [ ] Monitoring set up (optional)

---

## 🎯 Quick Reference

### **Recommended Stack**

```
Frontend:  Vercel
Backend:   Render
Database:  PostgreSQL (Render)
Domain:    Namecheap/Cloudflare
```

### **Deployment Times**

- **Frontend**: 2-3 minutes
- **Backend**: 5-10 minutes
- **Total**: ~15 minutes

### **Cost**

- **Free Tier**: $0/month (with limitations)
- **Paid Tier**: ~$14/month (backend + database)

---

## 🆘 Need Help?

- 📧 Email: diyaumale9@gmail.com
- 🐛 Issues: https://github.com/diya200409/TransitOps/issues
- 📚 Docs: Check README.md

---

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

---

<div align="center">

**🎉 Happy Deploying!**

Made with ❤️ by TransitOps Team

</div>
