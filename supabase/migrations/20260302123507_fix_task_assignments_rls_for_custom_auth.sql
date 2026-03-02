/*
  # Fix task_assignments RLS for custom auth system

  ## Summary
  The app uses a custom auth system (not Supabase Auth), so RLS policies
  need to be permissive like the other tables. Dropping the profile-based
  policies and replacing with simple ones.

  ## Changes
  - Drop existing restrictive policies on task_assignments
  - Add permissive read/insert/delete policies matching the pattern used elsewhere
*/

DROP POLICY IF EXISTS "Students can view their own assignments" ON task_assignments;
DROP POLICY IF EXISTS "Admins can insert assignments" ON task_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON task_assignments;

CREATE POLICY "Anyone can read task assignments"
  ON task_assignments
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create task assignments"
  ON task_assignments
  FOR INSERT
  WITH CHECK (student_id IS NOT NULL AND student_id <> '');

CREATE POLICY "Anyone can delete task assignments"
  ON task_assignments
  FOR DELETE
  USING (id IS NOT NULL);
