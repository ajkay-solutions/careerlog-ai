# 🚀 Render.com Deployment Guide for WorkLog AI

## Overview
WorkLog AI requires **TWO separate services** on Render:
1. **Backend API** (Node.js/Express)
2. **Frontend** (Static Site/React)

---

## 📋 Step-by-Step Render Setup

### **Service 1: Backend API**

#### 1.1 Create New Web Service
- Go to [Render Dashboard](https://dashboard.render.com)
- Click **"New +"** → **"Web Service"**
- Connect your GitHub repository: `worklog-ai` (single repo)
- **Service Name**: `worklog-ai-backend`

#### 1.2 Configure Build & Deploy Settings

**Basic Settings:**
```
Environment: Node
Region: Oregon (or your preferred)
Branch: main
Root Directory: (leave blank - we use cd backend in commands)
```

**Build & Deploy:**
```
Build Command: cd backend && npm ci && npx prisma generate
Start Command: cd backend && npm start
```

**Advanced Settings:**
```
Port: 10000 (Render default)
Health Check Path: /api/health/status
Auto-Deploy: Yes
```

#### 1.3 Environment Variables (Backend)
Add these in the "Environment" tab:

**Required Variables:**
```bash
NODE_ENV=production
PORT=10000

# Database (Production Supabase)
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Redis (Production Upstash)
REDIS_URL=redis://default:[password]@us1-xxx.upstash.io:6379

# OAuth (same as development)
GOOGLE_CLIENT_ID=677875518045-8qa0q2msug0ngmgvkokc5s3somaooh0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[your-google-client-secret]
LINKEDIN_CLIENT_ID=7730ozpx4pzs6w
LINKEDIN_CLIENT_SECRET=[your-linkedin-client-secret]

# AI
ANTHROPIC_API_KEY=sk-ant-api03-[your-key]

# Security (generate new for production)
JWT_SECRET=[new-256-bit-secret]
SESSION_SECRET=[new-session-secret]

# Email
MAILGUN_API_KEY=[your-mailgun-key]
MAILGUN_DOMAIN=mg.ajkaysolutions.com
```

#### 1.4 Deploy Backend
- Click **"Create Web Service"**
- Wait for deployment (5-10 minutes)
- Note the URL: `https://worklog-ai-backend.onrender.com`

---

### **Service 2: Frontend Static Site**

#### 2.1 Create New Static Site
- Go to [Render Dashboard](https://dashboard.render.com)
- Click **"New +"** → **"Static Site"**
- Connect same GitHub repository: `worklog-ai` (single repo)
- **Service Name**: `worklog-ai-frontend`

#### 2.2 Configure Build Settings

**Basic Settings:**
```
Branch: main
Root Directory: (leave blank)
```

**Build Settings:**
```
Build Command: cd frontend && npm ci && npm run build
Publish Directory: frontend/dist
```

#### 2.3 Environment Variables (Frontend)
```bash
VITE_API_URL=https://worklog-ai-backend.onrender.com
VITE_APP_NAME=WorkLog AI
```

#### 2.4 Custom Headers & Redirects
In "Settings" → "Redirects/Rewrites":
```
/* → /index.html (Rewrite)
```

#### 2.5 Deploy Frontend
- Click **"Create Static Site"**
- Wait for deployment (3-5 minutes)
- Note the URL: `https://worklog-ai-frontend.onrender.com`

---

## 🌐 Custom Domain Setup

### 3.1 Add Custom Domain to Frontend
- Go to frontend service → "Settings" → "Custom Domains"
- Add: `worklog.ajkaysolutions.com`
- Render will provide a CNAME target

### 3.2 Update DNS
- Add CNAME record in your DNS:
  ```
  Name: worklog
  Value: [render-provided-cname]
  TTL: 300
  ```

### 3.3 Update Backend Environment
Update frontend environment variable:
```bash
VITE_API_URL=https://worklog-ai-backend-[hash].onrender.com
```

---

## ✅ Verification Checklist

### Backend Health Checks
- [ ] `https://worklog-ai-backend-[hash].onrender.com/api/health/status` returns 200
- [ ] `https://worklog-ai-backend-[hash].onrender.com/auth/status` returns JSON
- [ ] Environment variables all set correctly
- [ ] Database connection working

### Frontend Checks  
- [ ] `https://worklog.ajkaysolutions.com` loads correctly
- [ ] Navigation works (React Router)
- [ ] Can reach login page
- [ ] API calls work (check browser network tab)

### OAuth Verification
- [ ] Google OAuth callback URL added: `https://worklog.ajkaysolutions.com/auth/google/callback`
- [ ] LinkedIn OAuth callback URL added: `https://worklog.ajkaysolutions.com/auth/linkedin/callback`
- [ ] Both OAuth flows work end-to-end

---

## 🔧 Common Issues & Solutions

### Backend Won't Start
```bash
# Check logs in Render dashboard
# Common issues:
- Missing environment variables
- Database connection failure
- Prisma client not generated
```

### Frontend 404 Errors
```bash
# Add redirect rule:
/* → /index.html (Rewrite)

# Check VITE_API_URL points to correct backend
```

### CORS Errors
```bash
# Backend automatically allows:
- https://worklog.ajkaysolutions.com (production)
- http://localhost:5173 (development)
```

### Database Connection Issues
```bash
# Ensure DATABASE_URL uses connection pooling:
?pgbouncer=true

# Check Supabase dashboard for connection limits
```

---

## 📊 Performance Optimization

### Free Tier Limitations
- **Backend**: Spins down after 15 minutes idle
- **Frontend**: Always available (static)
- **Database**: 500MB limit (Supabase free)
- **Redis**: 10K commands/day (Upstash free)

### Recommended Upgrades
```bash
# Backend: Starter Plan ($7/month)
- No spin-down
- Better performance
- SSL certificate

# Database: Supabase Pro ($25/month)
- 8GB storage
- Better performance
- More connections
```

---

## 🚨 Security Notes

### Environment Variables
- ✅ Never commit secrets to GitHub
- ✅ Use Render's environment variable system
- ✅ Generate new JWT secrets for production
- ✅ Rotate API keys periodically

### SSL/HTTPS
- ✅ Render provides SSL automatically
- ✅ Custom domain gets SSL certificate
- ✅ All traffic redirected to HTTPS

---

## 📞 Support

### Render Documentation
- [Web Services](https://render.com/docs/web-services)
- [Static Sites](https://render.com/docs/static-sites)
- [Environment Variables](https://render.com/docs/environment-variables)

### WorkLog AI Specific
- Check GitHub repository for latest configs
- Monitor Render logs for errors
- Use health endpoints for monitoring

---

## 🎯 Next Steps After Deployment

1. **Test all functionality end-to-end**
2. **Set up monitoring and alerts**
3. **Create beta user accounts**
4. **Document any deployment-specific issues**
5. **Plan scaling strategy for growth**

---

**Deployment Target**: `worklog.ajkaysolutions.com`  
**Backend Health**: `https://worklog-ai-backend-[hash].onrender.com/api/health/status`  
**Estimated Deployment Time**: 15-30 minutes total