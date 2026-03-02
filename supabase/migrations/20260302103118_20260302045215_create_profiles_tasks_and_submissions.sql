/*
  # Create profiles, tasks, and task_submissions tables

  ## Summary
  The app requires three tables that are missing from the database.
  This migration creates them in the correct dependency order.

  ## 1. profiles
  Stores user profile info. username is the primary key (text) matching
  how the app identifies users throughout — student_id fields everywhere
  store a plain username string, not a UUID.

  ## 2. tasks
  Admin-created tasks with optional file attachments stored in Supabase
  Storage under the 'task-files' bucket. Supports multiple files via
  task_files JSONB array and a single legacy file_name/file_path pair.

  ## 3. task_submissions
  Student submissions for tasks. student_id is text (username) to match
  how TaskView.tsx inserts: `student_id: user.username`. Files are stored
  as JSONB { filename: content } capturing everything in the editor.

  ## Security
  - RLS enabled on all three tables
  - Profiles: users read their own, admins read all
  - Tasks: public read (students need to load tasks), admin write
  - Task submissions: students manage their own, admins read/update all
*/

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (username = (SELECT auth.jwt() ->> 'email') OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 2. TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  file_name text,
  file_path text,
  task_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read tasks"
  ON tasks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can create tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update tasks"
  ON tasks FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- 3. TASK_SUBMISSIONS TABLE
--
-- student_id is TEXT (not UUID) because the app stores user.username
-- directly (e.g. "john_doe") rather than a UUID foreign key.
-- =====================================================

CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  files jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_share_id text,
  submitted_at timestamptz DEFAULT now(),
  reviewed boolean NOT NULL DEFAULT false,
  UNIQUE(task_id, student_id)
);

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_student_id ON task_submissions(student_id);

CREATE POLICY "Students can view own submissions"
  ON task_submissions FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.jwt() ->> 'email') OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Students can create own submissions"
  ON task_submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.jwt() ->> 'email') OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Students can update own unreviewed submissions"
  ON task_submissions FOR UPDATE TO authenticated
  USING (
    (student_id = (SELECT auth.jwt() ->> 'email') AND reviewed = false)
    OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    student_id = (SELECT auth.jwt() ->> 'email')
    OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update all submissions"
  ON task_submissions FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');