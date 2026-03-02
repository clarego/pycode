/*
  # Fix anon role for storage uploads and tasks

  ## Problem
  This app uses a custom auth system and never signs users into Supabase Auth.
  All requests therefore use the `anon` role. Storage INSERT and DELETE policies
  were scoped to `authenticated` only, blocking file uploads and deletes entirely.

  ## Changes
  - Drop storage policies scoped to `authenticated`
  - Re-create them to also allow `anon`
*/

DROP POLICY IF EXISTS "Allow authenticated uploads to task-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from task-files" ON storage.objects;

CREATE POLICY "Allow anon uploads to task-files"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'task-files');

CREATE POLICY "Allow authenticated uploads to task-files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'task-files');

CREATE POLICY "Allow anon deletes from task-files"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'task-files');

CREATE POLICY "Allow authenticated deletes from task-files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'task-files');
