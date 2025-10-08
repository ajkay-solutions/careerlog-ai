-- ============================================================================
-- WorkLog AI - UserProvider Table Migration for PRODUCTION
-- ============================================================================
-- 
-- This script migrates the existing single-provider User table to support
-- multiple OAuth providers per user using a UserProvider junction table.
--
-- CRITICAL: Run this during a maintenance window as it involves data migration
-- 
-- Expected execution time: < 1 minute for typical user counts
-- 
-- ============================================================================

-- Step 1: Create UserProvider table with proper constraints and indexes
-- ============================================================================

CREATE TABLE IF NOT EXISTS "UserProvider" (
    "id" TEXT NOT NULL,
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
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProvider_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add constraints and indexes for performance
-- ============================================================================

-- Unique constraint: one provider per user
CREATE UNIQUE INDEX IF NOT EXISTS "UserProvider_userId_provider_key" 
ON "UserProvider"("userId", "provider");

-- Index for fast provider lookups
CREATE INDEX IF NOT EXISTS "UserProvider_provider_idx" 
ON "UserProvider"("provider");

-- Index for user lookups
CREATE INDEX IF NOT EXISTS "UserProvider_userId_idx" 
ON "UserProvider"("userId");

-- Index for lastUsed ordering
CREATE INDEX IF NOT EXISTS "UserProvider_lastUsed_idx" 
ON "UserProvider"("lastUsed" DESC);

-- Step 3: Add foreign key constraint (if User table exists)
-- ============================================================================

DO $$
BEGIN
    -- Check if User table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        -- Add foreign key constraint with proper naming
        ALTER TABLE "UserProvider" 
        ADD CONSTRAINT "UserProvider_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Foreign key already exists, skip
        NULL;
END
$$;

-- Step 4: Migrate existing user data to UserProvider table
-- ============================================================================

INSERT INTO "UserProvider" (
    "id",
    "userId", 
    "provider", 
    "providerId",
    "displayName",
    "email",
    "profilePhoto",
    "profileData",
    "createdAt",
    "lastUsed"
)
SELECT 
    -- Generate unique ID for UserProvider records
    'up_' || encode(digest(u."id" || '_' || u."provider", 'sha256'), 'hex'),
    u."id",
    u."provider",
    u."providerId",
    u."displayName",
    u."email",
    u."profilePhoto",
    -- Create basic profile data JSON
    jsonb_build_object(
        'id', u."providerId",
        'displayName', u."displayName",
        'email', u."email",
        'profilePhoto', u."profilePhoto"
    ),
    u."createdAt",
    COALESCE(u."lastLoginAt", u."createdAt")
FROM "User" u
WHERE u."provider" IS NOT NULL 
  AND u."providerId" IS NOT NULL
  -- Avoid duplicates if script is run multiple times
  AND NOT EXISTS (
    SELECT 1 FROM "UserProvider" up 
    WHERE up."userId" = u."id" AND up."provider" = u."provider"
  );

-- Step 5: Enable Row Level Security (RLS) for UserProvider table
-- ============================================================================

ALTER TABLE "UserProvider" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own provider records
CREATE POLICY IF NOT EXISTS "Users can access own providers"
    ON "UserProvider"
    FOR ALL
    USING (auth.uid()::text = "userId");

-- Policy: Users can only insert provider records for themselves
CREATE POLICY IF NOT EXISTS "Users can insert own providers"
    ON "UserProvider"
    FOR INSERT
    WITH CHECK (auth.uid()::text = "userId");

-- Policy: Users can only update their own provider records
CREATE POLICY IF NOT EXISTS "Users can update own providers"
    ON "UserProvider"
    FOR UPDATE
    USING (auth.uid()::text = "userId")
    WITH CHECK (auth.uid()::text = "userId");

-- Policy: Users can only delete their own provider records
CREATE POLICY IF NOT EXISTS "Users can delete own providers"
    ON "UserProvider"
    FOR DELETE
    USING (auth.uid()::text = "userId");

-- Step 6: Create trigger to automatically update the updatedAt timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for UserProvider table
DROP TRIGGER IF EXISTS update_userprovider_updated_at ON "UserProvider";
CREATE TRIGGER update_userprovider_updated_at
    BEFORE UPDATE ON "UserProvider"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Verification queries
-- ============================================================================

-- Count records in both tables
DO $$
DECLARE
    user_count INTEGER;
    provider_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "User";
    SELECT COUNT(*) INTO provider_count FROM "UserProvider";
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '  - Users in User table: %', user_count;
    RAISE NOTICE '  - Provider records in UserProvider table: %', provider_count;
    RAISE NOTICE '  - Expected ratio: 1:1 (one provider per user initially)';
    
    IF provider_count = 0 THEN
        RAISE WARNING 'No UserProvider records created. Check User table data.';
    END IF;
END
$$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- The UserProvider table is now ready for multi-provider OAuth support.
-- The application backend has been updated to use this new table structure.
-- 
-- Next steps:
-- 1. Verify the migration results using the counts above
-- 2. Test OAuth login flows in the application
-- 3. Monitor application logs for any database errors
-- 4. The old provider/providerId columns in User table can be kept for backward compatibility
-- 
-- ============================================================================