# 🚀 Setup Separate Development Database in Mumbai

## Why This Strategy?

**Production Architecture:**
- Render.com (US East) + Supabase (US East) = Low latency for production
- Good for US/global users

**Development Architecture:**  
- Your machine (Indore) + Supabase (Mumbai) = Low latency for development
- **1.4s queries → ~100-200ms queries**

## Steps to Setup Mumbai Dev Database:

### 1. Create New Supabase Project in Mumbai
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Choose region: **"Asia South (Mumbai)" - ap-south-1**
4. Name it: `worklog-ai-dev-mumbai`

### 2. Copy Database Schema
```bash
# Export schema from current (US) database
cd /home/ajk/worklog-ai/backend
npx prisma db pull
npx prisma migrate dev --create-only --name init
```

### 3. Update Development Environment
Create `/home/ajk/worklog-ai/backend/.env.local`:
```bash
# Development Database (Mumbai)
DATABASE_URL="postgresql://postgres.YOUR_NEW_PROJECT:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.YOUR_NEW_PROJECT:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Same OAuth, Redis, etc.
GOOGLE_CLIENT_ID=677875518045-8qa0q2msug0ngmgvkvokc5s3somaooh0.apps.googleusercontent.com
# ... (copy rest from .env)
```

### 4. Use Environment-Specific Config
Update your start script in `package.json`:
```json
{
  "scripts": {
    "dev": "cp .env.local .env && nodemon src/server.js",
    "dev:prod-db": "nodemon src/server.js"
  }
}
```

### 5. Run Migration on Mumbai Database
```bash
cd /home/ajk/worklog-ai/backend
npm run dev  # This will use Mumbai DB
npx prisma migrate deploy
```

## Expected Performance:
- **Current**: 1.4-2.8 seconds per query (to US)
- **With Mumbai**: 100-300ms per query (to Mumbai)
- **Improvement**: ~10x faster development experience!

## Benefits:
✅ **Fast Development**: No more waiting 2+ seconds for each page load
✅ **Production Safety**: Production DB stays in US near Render
✅ **Cost Effective**: Both Supabase projects stay on free tier initially
✅ **Easy Switching**: Can switch between dev/prod databases easily

## Alternative: Local PostgreSQL (Even Faster)
If you want maximum speed for development:
```bash
sudo apt install postgresql
# Setup local DB - queries will be 10-50ms instead of 1400ms
```

Which approach would you prefer?