# 🚀 QUICK FIX: Local Database Setup

## Problem
Database queries are taking 1.4-2.8 seconds because your Supabase is in US East but you're in India (Indore). That's ~12,000km of network latency!

## Quick Solution: Local PostgreSQL

### 1. Install PostgreSQL locally
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Setup local database
```bash
sudo -u postgres psql
CREATE DATABASE worklog_ai_dev;
CREATE USER worklog_user WITH ENCRYPTED PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE worklog_ai_dev TO worklog_user;
\q
```

### 3. Update .env for local development
```bash
# Replace this line in /home/ajk/worklog-ai/backend/.env:
DATABASE_URL="postgresql://worklog_user:dev_password_123@localhost:5432/worklog_ai_dev"
DIRECT_URL="postgresql://worklog_user:dev_password_123@localhost:5432/worklog_ai_dev"
```

### 4. Run migration
```bash
cd /home/ajk/worklog-ai/backend
npx prisma migrate dev
npx prisma db seed # if you have seed data
```

## Expected Performance Improvement
- Current: 1.4-2.8 seconds per query
- Local: 10-50 milliseconds per query
- **Improvement: 50-280x faster!**

## Alternative: Quick Supabase Region Migration

1. Go to https://supabase.com/dashboard
2. Create new project in **Asia Pacific (Singapore)** region
3. Export existing data from old project
4. Import to new project
5. Update connection strings

## Why This Happens
```
India (Indore) → US East (Virginia) → Back to India
   ~200ms          database         ~200ms
           total: ~400ms base latency
```

Even the fastest queries have 400ms+ network overhead before database processing!