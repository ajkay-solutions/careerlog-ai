-- =====================================================
-- DEVELOPMENT MIGRATION SCRIPT - UserProvider Table
-- =====================================================
-- This script migrates the current single-provider system to 
-- a multi-provider system with UserProvider junction table
-- 
-- Run this in Supabase SQL Editor for DEVELOPMENT environment
-- =====================================================

-- Step 1: Create UserProvider table
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

-- Step 2: Add indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS "UserProvider_provider_providerId_key" 
  ON "UserProvider"("provider", "providerId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserProvider_userId_provider_key" 
  ON "UserProvider"("userId", "provider");

CREATE INDEX IF NOT EXISTS "UserProvider_userId_idx" 
  ON "UserProvider"("userId");

CREATE INDEX IF NOT EXISTS "UserProvider_provider_idx" 
  ON "UserProvider"("provider");

CREATE INDEX IF NOT EXISTS "UserProvider_userId_lastUsed_idx" 
  ON "UserProvider"("userId", "lastUsed");

-- Step 3: Enable Row Level Security
ALTER TABLE "UserProvider" ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view their own providers" ON "UserProvider"
  FOR SELECT USING (true);  -- In dev, allow all reads for testing

CREATE POLICY "Users can insert their own providers" ON "UserProvider"
  FOR INSERT WITH CHECK (true);  -- In dev, allow all inserts for testing

CREATE POLICY "Users can update their own providers" ON "UserProvider"
  FOR UPDATE USING (true);  -- In dev, allow all updates for testing

CREATE POLICY "Users can delete their own providers" ON "UserProvider"
  FOR DELETE USING (true);  -- In dev, allow all deletes for testing

-- Step 5: Migrate existing user data to UserProvider table
DO $$
DECLARE
  user_record RECORD;
  existing_count INTEGER;
BEGIN
  -- Loop through all existing users
  FOR user_record IN 
    SELECT id, email, provider, "providerId", "displayName", "profilePhoto", 
           "createdAt", "lastLoginAt", name
    FROM "User" 
    WHERE provider IS NOT NULL AND "providerId" IS NOT NULL
  LOOP
    -- Check if UserProvider record already exists
    SELECT COUNT(*) INTO existing_count 
    FROM "UserProvider" 
    WHERE "userId" = user_record.id AND provider = user_record.provider;
    
    -- Only insert if it doesn't exist
    IF existing_count = 0 THEN
      INSERT INTO "UserProvider" (
        "userId", 
        provider, 
        "providerId", 
        "displayName", 
        email, 
        "profilePhoto",
        "profileData",
        "createdAt",
        "lastUsed"
      ) VALUES (
        user_record.id,
        user_record.provider,
        user_record."providerId",
        user_record."displayName",
        user_record.email,
        user_record."profilePhoto",
        COALESCE(user_record.name, '{}'::jsonb),
        user_record."createdAt",
        COALESCE(user_record."lastLoginAt", user_record."createdAt")
      );
      
      RAISE NOTICE 'Migrated user % with provider %', user_record.email, user_record.provider;
    ELSE
      RAISE NOTICE 'UserProvider already exists for % with provider %', user_record.email, user_record.provider;
    END IF;
  END LOOP;
END $$;

-- Step 6: Add update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "UserProvider_updatedAt"
  BEFORE UPDATE ON "UserProvider"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Verify migration
SELECT 
  u.email,
  u.provider as "current_provider",
  up.provider as "migrated_provider",
  up."providerId",
  up."profilePhoto",
  up."lastUsed"
FROM "User" u
LEFT JOIN "UserProvider" up ON u.id = up."userId"
ORDER BY u.email, up.provider;

-- Step 8: Check migration statistics
SELECT 
  'Users' as table_name, COUNT(*) as count 
FROM "User"
UNION ALL
SELECT 
  'UserProviders' as table_name, COUNT(*) as count 
FROM "UserProvider"
UNION ALL
SELECT 
  'Users with providers' as table_name, COUNT(DISTINCT "userId") as count 
FROM "UserProvider";

-- =====================================================
-- Migration Complete!
-- 
-- Next steps:
-- 1. Update backend OAuth providers to use UserProvider table
-- 2. Test authentication with both Google and LinkedIn
-- 3. Verify profile photos are properly stored and retrieved
-- =====================================================