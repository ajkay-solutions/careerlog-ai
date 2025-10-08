-- ============================================================================
-- WorkLog AI - UserProvider Table Rollback Script for PRODUCTION
-- ============================================================================
-- 
-- This script provides a rollback mechanism for the UserProvider migration.
-- Use this ONLY if there are critical issues with the UserProvider table.
--
-- CRITICAL: This script will delete the UserProvider table and all its data
-- Only run this if you need to completely revert the migration
-- 
-- ============================================================================

-- Step 1: Verification - Show current state before rollback
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
    provider_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "User";
    SELECT COUNT(*) INTO provider_count FROM "UserProvider";
    
    RAISE NOTICE 'Current state before rollback:';
    RAISE NOTICE '  - Users in User table: %', user_count;
    RAISE NOTICE '  - Provider records in UserProvider table: %', provider_count;
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: This rollback will delete all UserProvider data!';
END
$$;

-- Step 2: Drop RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can access own providers" ON "UserProvider";
DROP POLICY IF EXISTS "Users can insert own providers" ON "UserProvider";
DROP POLICY IF EXISTS "Users can update own providers" ON "UserProvider";
DROP POLICY IF EXISTS "Users can delete own providers" ON "UserProvider";

-- Step 3: Drop triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_userprovider_updated_at ON "UserProvider";

-- Step 4: Drop indexes (they will be dropped with the table, but explicit for safety)
-- ============================================================================

DROP INDEX IF EXISTS "UserProvider_userId_provider_key";
DROP INDEX IF EXISTS "UserProvider_provider_idx";
DROP INDEX IF EXISTS "UserProvider_userId_idx";
DROP INDEX IF EXISTS "UserProvider_lastUsed_idx";

-- Step 5: Drop foreign key constraint (if it exists)
-- ============================================================================

DO $$
BEGIN
    ALTER TABLE "UserProvider" DROP CONSTRAINT IF EXISTS "UserProvider_userId_fkey";
EXCEPTION
    WHEN undefined_object THEN
        -- Constraint doesn't exist, skip
        NULL;
END
$$;

-- Step 6: Drop the UserProvider table completely
-- ============================================================================

DROP TABLE IF EXISTS "UserProvider" CASCADE;

-- Step 7: Drop the trigger function (if not used elsewhere)
-- ============================================================================

-- Note: Only drop if this function is not used by other tables
-- Check manually before uncommenting:
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 8: Verification - Confirm rollback completion
-- ============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'UserProvider'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'ERROR: UserProvider table still exists!';
    ELSE
        RAISE NOTICE 'SUCCESS: UserProvider table has been completely removed.';
        RAISE NOTICE 'The system has been rolled back to single-provider authentication.';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps after rollback:';
        RAISE NOTICE '1. Deploy the previous version of the backend code';
        RAISE NOTICE '2. Verify that OAuth login still works with the User table';
        RAISE NOTICE '3. Check application logs for any errors';
    END IF;
END
$$;

-- ============================================================================
-- Rollback Complete
-- ============================================================================
-- 
-- The UserProvider table and all related database objects have been removed.
-- The system is now back to using only the User table for authentication.
-- 
-- Important notes:
-- 1. All multi-provider data has been lost
-- 2. Users will need to re-authenticate
-- 3. The backend code must be reverted to the previous version
-- 4. Consider re-running the migration with fixes rather than staying rolled back
-- 
-- ============================================================================