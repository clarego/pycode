/*
  # Add files column to task_submissions

  Stores all submitted code files as a JSONB object where keys are filenames
  and values are file contents. This replaces the single file_name/file_path
  approach so that all files from the student's editor are captured on submit.

  1. Modified Tables
    - `task_submissions`
      - Added `files` (jsonb) - stores { "filename": "content", ... }
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'files'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN files jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
