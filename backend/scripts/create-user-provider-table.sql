-- Create UserProvider table for multi-provider OAuth support
-- This is a safe, additive migration that preserves existing data

CREATE TABLE IF NOT EXISTS "UserProvider" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "displayName" TEXT,
  "email" TEXT,
  "profilePhoto" TEXT,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "profileData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "UserProvider_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "UserProvider_provider_providerId_key" 
  ON "UserProvider"("provider", "providerId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserProvider_userId_provider_key" 
  ON "UserProvider"("userId", "provider");

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "UserProvider_userId_idx" ON "UserProvider"("userId");
CREATE INDEX IF NOT EXISTS "UserProvider_provider_idx" ON "UserProvider"("provider");
CREATE INDEX IF NOT EXISTS "UserProvider_userId_lastUsed_idx" ON "UserProvider"("userId", "lastUsed");

-- Enable Row Level Security (RLS) for the new table
ALTER TABLE "UserProvider" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to access only their own providers
CREATE POLICY "Users can view their own providers" ON "UserProvider"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own providers" ON "UserProvider"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own providers" ON "UserProvider"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own providers" ON "UserProvider"
  FOR DELETE USING (auth.uid()::text = "userId");