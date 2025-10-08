-- Step 1: Create Database Schema
-- Execute this in your NEW Mumbai Supabase project SQL Editor

-- Create Users table
CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "displayName" TEXT,
    name JSONB,
    "profilePhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    
    CONSTRAINT "User_provider_providerId_key" UNIQUE (provider, "providerId")
);

-- Create Projects table
CREATE TABLE "Project" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Project_userId_name_key" UNIQUE ("userId", name),
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Skills table
CREATE TABLE "Skill" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    "firstUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Skill_userId_name_key" UNIQUE ("userId", name),
    CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Competencies table
CREATE TABLE "Competency" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name TEXT NOT NULL,
    framework TEXT,
    description TEXT,
    "demonstrationCount" INTEGER NOT NULL DEFAULT 0,
    "lastDemonstrated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Competency_userId_name_key" UNIQUE ("userId", name),
    CONSTRAINT "Competency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Entries table
CREATE TABLE "Entry" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    date TIMESTAMP(3) NOT NULL,
    "rawText" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "extractedData" JSONB,
    "projectIds" TEXT[] DEFAULT '{}',
    "skillIds" TEXT[] DEFAULT '{}',
    "competencyIds" TEXT[] DEFAULT '{}',
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    sentiment TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Entry_userId_date_key" UNIQUE ("userId", date),
    CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create UserSettings table
CREATE TABLE "UserSettings" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "reminderTime" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiPromptStyle" TEXT NOT NULL DEFAULT 'balanced',
    "defaultTags" TEXT[] DEFAULT '{}',
    "allowExport" BOOLEAN NOT NULL DEFAULT true,
    "allowAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create performance indexes
CREATE INDEX "User_email_idx" ON "User"(email);

CREATE INDEX "Entry_date_idx" ON "Entry"(date);
CREATE INDEX "Entry_userId_createdAt_idx" ON "Entry"("userId", "createdAt");
CREATE INDEX "Entry_userId_date_idx" ON "Entry"("userId", date);
CREATE INDEX "Entry_userId_isHighlight_idx" ON "Entry"("userId", "isHighlight");
CREATE INDEX "Entry_userId_sentiment_idx" ON "Entry"("userId", sentiment);
CREATE INDEX "Entry_userId_wordCount_idx" ON "Entry"("userId", "wordCount");

CREATE INDEX "Project_userId_idx" ON "Project"("userId");
CREATE INDEX "Project_userId_entryCount_idx" ON "Project"("userId", "entryCount");
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", status);
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt");

CREATE INDEX "Skill_userId_idx" ON "Skill"("userId");
CREATE INDEX "Skill_userId_category_idx" ON "Skill"("userId", category);
CREATE INDEX "Skill_userId_lastUsed_idx" ON "Skill"("userId", "lastUsed");
CREATE INDEX "Skill_userId_usageCount_idx" ON "Skill"("userId", "usageCount");

CREATE INDEX "Competency_userId_idx" ON "Competency"("userId");
CREATE INDEX "Competency_userId_demonstrationCount_idx" ON "Competency"("userId", "demonstrationCount");
CREATE INDEX "Competency_userId_framework_idx" ON "Competency"("userId", framework);
CREATE INDEX "Competency_userId_lastDemonstrated_idx" ON "Competency"("userId", "lastDemonstrated");