/*
  # Fix tasks RLS policies to allow authenticated users

  ## Problem
  The tasks INSERT policy was scoped to the `anon` role only.
  Admins who are logged in via Supabase Auth use the `authenticated` role,
  so their inserts were blocked by RLS with "new row violates row-level security policy".

  ## Changes
  - Drop existing tasks policies scoped to `anon`
  - Re-create them to cover both `anon` and `authenticated` roles
  - Also fix storage object INSERT policy to allow authenticated uploads
*/

DROP POLICY IF EXISTS "Anyone can create tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can read tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can delete tasks" ON tasks;

CREATE POLICY "Anyone can read tasks"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK ((share_code IS NOT NULL) AND (share_code <> ''));

CREATE POLICY "Anon users can create tasks"
  ON tasks FOR INSERT
  TO anon
  WITH CHECK ((share_code IS NOT NULL) AND (share_code <> ''));

CREATE POLICY "Anyone can update tasks"
  ON tasks FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Anyone can delete tasks"
  ON tasks FOR DELETE
  USING (id IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated uploads to task-files" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to task-files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'task-files');
