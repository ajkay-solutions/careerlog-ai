# Week 6 Production Deployment Checklist

## 🚀 WorkLog AI Production Launch Checklist

**Target**: Deploy WorkLog AI to production at `worklog.ajkaysolutions.com`  
**Timeline**: Week 6 of MVP development  
**Status**: Ready for deployment after Week 5 completion

---

## 📋 Your Action Items (Required)

### 1. Domain Setup
- [ ] **Add DNS Record**
  - Record Type: `CNAME`
  - Name: `worklog`
  - Value: `[render-app-url]` (will provide after Render setup)
  - TTL: `300` (5 minutes)
- [ ] **Verify DNS Propagation** (use: https://dnschecker.org)

### 2. OAuth Production Callbacks

#### 🚨 **URGENT: Fix Google OAuth Development Setup First**
- [ ] **Google Cloud Console** - Fix Development Issue
  - Go to: https://console.cloud.google.com
  - Navigate to: APIs & Services → Credentials
  - Find OAuth 2.0 Client ID: `677875518045-8qa0q2msug0ngmgvkokc5s3somaooh0.apps.googleusercontent.com`
  - **Add MISSING development callback to "Authorized redirect URIs":**
    - `http://localhost:3004/auth/google/callback` ⚠️ **MISSING - CAUSES 404 ERROR**
  - **Add production callback:**
    - `https://worklog.ajkaysolutions.com/auth/google/callback`
  - Click "Save"
  
**Issue Found**: Google OAuth returns "invalid_client" error because `http://localhost:3004/auth/google/callback` is not in the authorized redirect URIs.

- [ ] **LinkedIn Developer Console**
  - Go to: https://www.linkedin.com/developers
  - Find App ID: `7730ozpx4pzs6w`
  - Navigate to: Auth tab
  - Add to "Authorized redirect URLs for your app":
    - `https://worklog.ajkaysolutions.com/auth/linkedin/callback`
  - Click "Update"

### 3. Render.com Account Setup
- [ ] **Create/Access Render Account**
  - Go to: https://dashboard.render.com
  - Ensure you can create new services
  - Note: Free tier has limitations (spins down after 15min idle)

- [ ] **Consider Upgrade** (Optional but Recommended)
  - Upgrade to paid plan for:
    - No spin-down delays
    - Better performance
    - SSL certificate
    - Cost: ~$7-10/month

### 4. Production Environment Secrets
- [ ] **Generate New JWT Secrets**
  ```bash
  # Generate JWT_SECRET (256-bit)
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  
  # Generate SESSION_SECRET
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - [ ] Copy and save these values securely

- [ ] **Gather Existing API Keys**
  - [ ] `ANTHROPIC_API_KEY` (from your Anthropic console)
  - [ ] `GOOGLE_CLIENT_SECRET` (from Google Cloud Console)
  - [ ] `LINKEDIN_CLIENT_SECRET` (from LinkedIn Developer)
  - [ ] `MAILGUN_API_KEY` (from Mailgun dashboard)

### 5. Database & Cache (Production Instances)
- [ ] **Supabase Production Database**
  - Go to: https://supabase.com/dashboard
  - Create new project or use existing
  - Get connection strings:
    - [ ] `DATABASE_URL` (connection pooling)
    - [ ] `DIRECT_URL` (direct connection)

- [ ] **Upstash Redis Production**
  - Go to: https://console.upstash.com
  - Create new Redis database or use existing
  - Get connection string:
    - [ ] `REDIS_URL`

---

## ✅ Claude Will Handle (After Your Setup)

### 1. Render Deployment Configuration
- [ ] Create new web service on Render
- [ ] Connect to GitHub repository
- [ ] Configure build and start commands
- [ ] Set up environment variables
- [ ] Deploy backend service

### 2. Frontend Deployment
- [ ] Configure frontend build for production
- [ ] Deploy frontend to Render
- [ ] Configure custom domain
- [ ] Set up SSL certificate

### 3. Production Testing
- [ ] Verify all authentication flows
- [ ] Test core journaling functionality
- [ ] Validate AI analysis pipeline
- [ ] Test export/generation features
- [ ] Check performance benchmarks

### 4. Monitoring Setup
- [ ] Configure health check endpoints
- [ ] Set up error monitoring
- [ ] Implement usage analytics
- [ ] Create alerting system

### 5. Beta Launch Preparation
- [ ] Create user onboarding flow
- [ ] Prepare beta user documentation
- [ ] Set up feedback collection
- [ ] Plan beta user recruitment

---

## 📝 Information Exchange

### What You'll Provide to Claude:
```
When you complete your setup, share:
- [ ] "DNS configured" + domain verification screenshot
- [ ] "OAuth callbacks added" confirmation
- [ ] Generated JWT_SECRET and SESSION_SECRET
- [ ] Production DATABASE_URL and DIRECT_URL
- [ ] Production REDIS_URL
- [ ] Render.com account email/access confirmation
```

### What Claude Will Provide to You:
```
After deployment setup:
- [ ] Render app URL for DNS configuration
- [ ] Production deployment status
- [ ] Testing results and any issues
- [ ] Final production URL: worklog.ajkaysolutions.com
- [ ] Beta user onboarding instructions
```

---

## 🎯 Success Criteria

### Technical Requirements
- [ ] Production site accessible at `worklog.ajkaysolutions.com`
- [ ] SSL certificate active (HTTPS)
- [ ] All authentication providers working
- [ ] Page load times < 2 seconds
- [ ] 95%+ uptime monitoring
- [ ] All export formats functional

### User Experience
- [ ] Smooth onboarding flow
- [ ] Error handling with user-friendly messages
- [ ] Responsive design on desktop and mobile
- [ ] Data privacy and security compliance

### Business Metrics
- [ ] Analytics tracking setup
- [ ] User registration flow working
- [ ] Performance monitoring active
- [ ] Beta user feedback system ready

---

## 🚨 Important Notes

### Security Reminders
- ✅ Never commit production secrets to GitHub
- ✅ Use environment variables for all sensitive data
- ✅ Verify OAuth redirect URLs match exactly
- ✅ Ensure HTTPS is enforced in production

### Performance Expectations
- ✅ 90%+ performance improvement from Redis caching
- ✅ Sub-250ms response times for cached operations
- ✅ Optimized database queries with connection pooling
- ✅ Efficient bundle sizes with Vite production build

### Rollback Plan
- ✅ Keep development environment functional
- ✅ Database migrations are reversible
- ✅ Can revert to previous GitHub commit if needed
- ✅ DNS changes can be quickly reverted

---

## 📞 Ready to Proceed?

**Once you complete items 1-5 above, notify Claude with:**
> "Setup complete - ready for deployment"

**Include:**
- Confirmation of each completed item
- Any issues encountered
- Production environment values
- Preferred deployment timing

---

**Estimated Time**: 30-60 minutes for your setup tasks  
**Estimated Deployment Time**: 1-2 hours for full production deployment  
**Go Live Target**: End of Week 6

🚀 **Let's make WorkLog AI live!**