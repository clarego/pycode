/*
  # Create task-files storage bucket

  ## Summary
  The task-files storage bucket is required for admins to upload attachments
  when creating tasks. Without it, file uploads fail with a 400 "bucket not found" error.

  ## Changes
  - Create `task-files` storage bucket (public: false)
  - Add storage policies so uploads and downloads work
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-files', 'task-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated uploads to task-files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'task-files');

CREATE POLICY "Allow public reads from task-files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'task-files');

CREATE POLICY "Allow authenticated deletes from task-files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'task-files');
