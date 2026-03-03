/*
  # Add binary files support to saved_projects

  ## Summary
  Adds a `binary_files` JSONB column to `saved_projects` that stores a mapping of
  filename -> storage path for binary files (PDFs, images, etc.) associated with a project.
  Binary file content is stored in Supabase Storage; this column stores the paths.

  ## Changes
  - `saved_projects`: new `binary_files` jsonb column (default empty object)

  ## Storage
  - Creates a `project-files` storage bucket for binary file content (PDFs, images)
  - Policies allow authenticated users to manage their own files under their username prefix

  ## Security
  - RLS already enabled on saved_projects table
  - Storage policies restrict access by username prefix
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_projects' AND column_name = 'binary_files'
  ) THEN
    ALTER TABLE saved_projects ADD COLUMN binary_files jsonb NOT NULL DEFAULT '{}';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  52428800,
  ARRAY['image/png','image/jpeg','image/gif','image/svg+xml','image/webp','image/bmp','image/x-icon','application/pdf','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own project files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = (auth.jwt() ->> 'username')
  );

CREATE POLICY "Users can read their own project files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = (auth.jwt() ->> 'username')
  );

CREATE POLICY "Users can delete their own project files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = (auth.jwt() ->> 'username')
  );

CREATE POLICY "Users can update their own project files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = (auth.jwt() ->> 'username')
  )
  WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = (auth.jwt() ->> 'username')
  );
