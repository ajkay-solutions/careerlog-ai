# 🗄️ Production Database Setup Guide - Supabase

## Overview
Set up `worklog-ai-prod` database on Supabase with complete schema, indexes, and Row Level Security (RLS) policies.

---

## 📋 Step-by-Step Setup

### **Step 1: Create Production Project**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Click **"New project"**

2. **Project Configuration**
   ```
   Organization: [Your organization]
   Name: worklog-ai-prod
   Database Password: [Generate strong password - save it!]
   Region: US East (or your preferred region)
   Pricing Plan: Free (or Pro if needed)
   ```

3. **Wait for Provisioning** (2-3 minutes)

---

### **Step 2: Get Connection Strings**

After project is ready, go to **Settings** → **Database**:

1. **Copy Connection Strings**
   ```bash
   # Pooled Connection (for application)
   DATABASE_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
   
   # Direct Connection (for migrations)
   DIRECT_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
   ```

2. **Save These Values** - You'll need them for Render deployment

---

### **Step 3: Create Database Schema**

1. **Open SQL Editor**
   - In Supabase dashboard → **SQL Editor**
   - Click **"New query"**

2. **Run Schema Creation Script**
   - Copy the entire contents of `/database-migration.sql`
   - Paste into SQL Editor
   - Click **"Run"**

**Full Schema SQL:**
```sql
-- WorkLog AI Database Schema Creation
-- Copy this entire script and paste it into Supabase SQL Editor
-- Then click "Run" to create all tables

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "displayName" TEXT,
    "name" JSONB,
    "profilePhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderTime" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiPromptStyle" TEXT NOT NULL DEFAULT 'balanced',
    "defaultTags" TEXT[],
    "allowExport" BOOLEAN NOT NULL DEFAULT true,
    "allowAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rawText" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "extractedData" JSONB,
    "projectIds" TEXT[],
    "skillIds" TEXT[],
    "competencyIds" TEXT[],
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "sentiment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "firstUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competency" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "framework" TEXT,
    "description" TEXT,
    "demonstrationCount" INTEGER NOT NULL DEFAULT 0,
    "lastDemonstrated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Entry_userId_date_idx" ON "Entry"("userId", "date");

-- CreateIndex
CREATE INDEX "Entry_userId_createdAt_idx" ON "Entry"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_userId_date_key" ON "Entry"("userId", "date");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_name_key" ON "Project"("userId", "name");

-- CreateIndex
CREATE INDEX "Skill_userId_idx" ON "Skill"("userId");

-- CreateIndex
CREATE INDEX "Skill_userId_category_idx" ON "Skill"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_userId_name_key" ON "Skill"("userId", "name");

-- CreateIndex
CREATE INDEX "Competency_userId_idx" ON "Competency"("userId");

-- CreateIndex
CREATE INDEX "Competency_userId_framework_idx" ON "Competency"("userId", "framework");

-- CreateIndex
CREATE UNIQUE INDEX "Competency_userId_name_key" ON "Competency"("userId", "name");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Success message
SELECT 'WorkLog AI database schema created successfully!' as result;
```

3. **Verify Success**
   - Should see: ✅ "WorkLog AI database schema created successfully!"
   - Check **Table Editor** → Should see 6 tables

---

### **Step 4: Set Up Row Level Security (RLS)**

1. **Create New Query** in SQL Editor

2. **Run RLS Setup Script**
   - Copy the entire contents of `/database-rls-policies.sql`
   - Paste into SQL Editor
   - Click **"Run"**

**Full RLS SQL:**
```sql
-- Row Level Security (RLS) Policies for WorkLog AI
-- Copy this script and paste into Supabase SQL Editor
-- Run after the main database schema is created

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Competency" ENABLE ROW LEVEL SECURITY;

-- Helper function to get user ID from JWT token
CREATE OR REPLACE FUNCTION get_user_id_from_jwt()
RETURNS TEXT AS $$
DECLARE
  user_id TEXT;
BEGIN
  -- Extract user ID from JWT token claims
  -- The JWT should contain a 'sub' claim with the user's ID
  SELECT auth.jwt() ->> 'sub' INTO user_id;
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User table policies
-- Users can only see and update their own record
CREATE POLICY "Users can view own profile"
  ON "User"
  FOR SELECT
  USING (id = get_user_id_from_jwt());

CREATE POLICY "Users can update own profile"
  ON "User"
  FOR UPDATE
  USING (id = get_user_id_from_jwt());

-- UserSettings table policies
-- Users can only access their own settings
CREATE POLICY "Users can view own settings"
  ON "UserSettings"
  FOR SELECT
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can insert own settings"
  ON "UserSettings"
  FOR INSERT
  WITH CHECK ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can update own settings"
  ON "UserSettings"
  FOR UPDATE
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can delete own settings"
  ON "UserSettings"
  FOR DELETE
  USING ("userId" = get_user_id_from_jwt());

-- Entry table policies
-- Users can only access their own entries
CREATE POLICY "Users can view own entries"
  ON "Entry"
  FOR SELECT
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can insert own entries"
  ON "Entry"
  FOR INSERT
  WITH CHECK ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can update own entries"
  ON "Entry"
  FOR UPDATE
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can delete own entries"
  ON "Entry"
  FOR DELETE
  USING ("userId" = get_user_id_from_jwt());

-- Project table policies
-- Users can only access their own projects
CREATE POLICY "Users can view own projects"
  ON "Project"
  FOR SELECT
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can insert own projects"
  ON "Project"
  FOR INSERT
  WITH CHECK ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can update own projects"
  ON "Project"
  FOR UPDATE
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can delete own projects"
  ON "Project"
  FOR DELETE
  USING ("userId" = get_user_id_from_jwt());

-- Skill table policies
-- Users can only access their own skills
CREATE POLICY "Users can view own skills"
  ON "Skill"
  FOR SELECT
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can insert own skills"
  ON "Skill"
  FOR INSERT
  WITH CHECK ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can update own skills"
  ON "Skill"
  FOR UPDATE
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can delete own skills"
  ON "Skill"
  FOR DELETE
  USING ("userId" = get_user_id_from_jwt());

-- Competency table policies
-- Users can only access their own competencies
CREATE POLICY "Users can view own competencies"
  ON "Competency"
  FOR SELECT
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can insert own competencies"
  ON "Competency"
  FOR INSERT
  WITH CHECK ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can update own competencies"
  ON "Competency"
  FOR UPDATE
  USING ("userId" = get_user_id_from_jwt());

CREATE POLICY "Users can delete own competencies"
  ON "Competency"
  FOR DELETE
  USING ("userId" = get_user_id_from_jwt());

-- Success message
SELECT 'WorkLog AI Row Level Security policies created successfully!' as result;
```

3. **Verify RLS Setup**
   - Should see: ✅ "WorkLog AI Row Level Security policies created successfully!"
   - Check **Authentication** → **Policies** → Should see policies for all tables

---

### **Step 5: Verify Database Setup**

1. **Check Tables**
   - Go to **Table Editor**
   - Should see 6 tables: User, UserSettings, Entry, Project, Skill, Competency

2. **Check Indexes**
   - Go to **Database** → **Indexes**
   - Should see all performance indexes created

3. **Check RLS Policies**
   - Go to **Authentication** → **Policies** 
   - Should see policies for each table

4. **Test Connection**
   ```sql
   -- Run this test query in SQL Editor
   SELECT 
     schemaname,
     tablename,
     attname,
     pt_type.typname as typename
   FROM pg_catalog.pg_tables pt
   JOIN pg_catalog.pg_class pc ON pt.tablename = pc.relname
   JOIN pg_catalog.pg_attribute pa ON pc.oid = pa.attrelid
   JOIN pg_catalog.pg_type pt_type ON pa.atttypid = pt_type.oid
   WHERE pt.schemaname = 'public'
     AND pa.attnum > 0
     AND NOT pa.attisdropped
   ORDER BY tablename, attname;
   ```

---

### **Step 6: Update Environment Variables**

For Render deployment, use these connection strings:

```bash
# Replace [project] and [password] with your actual values
DATABASE_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

---

## ✅ Verification Checklist

### Database Structure
- [ ] 6 tables created (User, UserSettings, Entry, Project, Skill, Competency)
- [ ] All foreign key constraints in place
- [ ] All indexes created for performance
- [ ] Unique constraints set up properly

### Security
- [ ] RLS enabled on all tables
- [ ] Helper function `get_user_id_from_jwt()` created
- [ ] All CRUD policies created for each table
- [ ] Policies use JWT token for user isolation

### Performance
- [ ] Composite indexes for common queries
- [ ] Primary key indexes
- [ ] Foreign key indexes
- [ ] User-specific data indexes

### Connection
- [ ] Pooled connection string works
- [ ] Direct connection string works
- [ ] Database accessible from Render
- [ ] No connection timeout issues

---

## 🔧 Common Issues & Solutions

### **Script Fails to Run**
```sql
-- Check if tables already exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Drop existing tables if needed (DANGER - loses data!)
DROP TABLE IF EXISTS "Competency", "Skill", "Project", "Entry", "UserSettings", "User" CASCADE;
```

### **RLS Policies Fail**
```sql
-- Check existing policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Drop existing policies if needed
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
-- (repeat for all policies)
```

### **Connection Issues**
- Verify password is correct
- Check IP allowlist in Supabase (should allow all for Render)
- Ensure using pooled connection for application

---

## 🚀 Next Steps

1. **Save Connection Strings** for Render deployment
2. **Test Database** with a simple insert/select
3. **Deploy to Render** with production DATABASE_URL
4. **Verify End-to-End** connection from application

---

**Database Setup Complete! Ready for Production Deployment 🎉**