-- Row Level Security (RLS) Policies for WorkLog AI
-- Copy this script and paste it into Supabase SQL Editor
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