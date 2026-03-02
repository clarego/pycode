/*
  # Fix RLS policies for anon-based auth system

  ## Summary
  This app uses a custom auth system (users_login table + localStorage) rather
  than Supabase Auth. The Supabase client is always used as the anon role.
  All RLS policies must therefore grant access to anon/public, not authenticated.

  Security is enforced at the application layer by matching student_id (username)
  in queries — consistent with how all other tables in this project work.

  ## Changes
  - Drop authenticated-only policies on profiles, tasks, task_submissions
  - Recreate all policies allowing anon access
  - Tasks: public read, anyone can insert/update/delete (admin enforced in app)
  - Task submissions: anyone can read/write (username enforced in app queries)
  - Profiles: anyone can read/insert/update (admin enforced in app)
*/

-- =====================================================
-- DROP OLD authenticated-only POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

DROP POLICY IF EXISTS "Anyone authenticated can read tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can create tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;

DROP POLICY IF EXISTS "Students can view own submissions" ON task_submissions;
DROP POLICY IF EXISTS "Students can create own submissions" ON task_submissions;
DROP POLICY IF EXISTS "Students can update own unreviewed submissions" ON task_submissions;
DROP POLICY IF EXISTS "Admins can update all submissions" ON task_submissions;

-- =====================================================
-- PROFILES POLICIES (anon)
-- =====================================================

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT TO anon
  WITH CHECK (username IS NOT NULL AND username != '');

CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE TO anon
  USING (username IS NOT NULL)
  WITH CHECK (username IS NOT NULL);

CREATE POLICY "Anyone can delete profiles"
  ON profiles FOR DELETE TO anon
  USING (username IS NOT NULL);

-- =====================================================
-- TASKS POLICIES (anon)
-- =====================================================

CREATE POLICY "Anyone can read tasks"
  ON tasks FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anyone can create tasks"
  ON tasks FOR INSERT TO anon
  WITH CHECK (share_code IS NOT NULL AND share_code != '');

CREATE POLICY "Anyone can update tasks"
  ON tasks FOR UPDATE TO anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Anyone can delete tasks"
  ON tasks FOR DELETE TO anon
  USING (id IS NOT NULL);

-- =====================================================
-- TASK_SUBMISSIONS POLICIES (anon)
-- =====================================================

CREATE POLICY "Anyone can read task submissions"
  ON task_submissions FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anyone can create task submissions"
  ON task_submissions FOR INSERT TO anon
  WITH CHECK (student_id IS NOT NULL AND student_id != '');

CREATE POLICY "Anyone can update task submissions"
  ON task_submissions FOR UPDATE TO anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);
