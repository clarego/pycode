/*
  # Create task-files storage bucket

  ## Summary
  The tasks feature requires a storage bucket called 'task-files' where
  admins upload starter files (e.g. .ipynb, .pdf) that students download
  when they open a task link.

  ## Changes
  - Create 'task-files' bucket (public: false, file size limit: 50MB)
  - Add storage policies for anon access (matching the app's auth pattern)
    - Anyone can upload files (admin enforced at app layer)
    - Anyone can download files (students need to load task files)
    - Anyone can delete files (admin enforced at app layer)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  false,
  52428800,
  NULL
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload task files"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'task-files');

CREATE POLICY "Anyone can read task files"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'task-files');

CREATE POLICY "Anyone can delete task files"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'task-files');

CREATE POLICY "Anyone can update task files"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'task-files')
  WITH CHECK (bucket_id = 'task-files');
