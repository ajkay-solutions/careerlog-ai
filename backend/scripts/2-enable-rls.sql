-- Step 2: Enable Row Level Security (RLS)
-- Execute this in your NEW Mumbai Supabase project SQL Editor

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Competency" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;

-- User table policies
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "User"
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Allow user creation during signup" ON "User"
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Entry table policies
CREATE POLICY "Users can view own entries" ON "Entry"
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own entries" ON "Entry"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own entries" ON "Entry"
    FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own entries" ON "Entry"
    FOR DELETE USING (auth.uid()::text = "userId");

-- Project table policies
CREATE POLICY "Users can view own projects" ON "Project"
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own projects" ON "Project"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own projects" ON "Project"
    FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own projects" ON "Project"
    FOR DELETE USING (auth.uid()::text = "userId");

-- Skill table policies
CREATE POLICY "Users can view own skills" ON "Skill"
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own skills" ON "Skill"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own skills" ON "Skill"
    FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own skills" ON "Skill"
    FOR DELETE USING (auth.uid()::text = "userId");

-- Competency table policies
CREATE POLICY "Users can view own competencies" ON "Competency"
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own competencies" ON "Competency"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own competencies" ON "Competency"
    FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own competencies" ON "Competency"
    FOR DELETE USING (auth.uid()::text = "userId");

-- UserSettings table policies
CREATE POLICY "Users can view own settings" ON "UserSettings"
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own settings" ON "UserSettings"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own settings" ON "UserSettings"
    FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own settings" ON "UserSettings"
    FOR DELETE USING (auth.uid()::text = "userId");