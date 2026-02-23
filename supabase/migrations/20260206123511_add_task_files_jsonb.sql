/*
  # Add multi-file support to tasks

  1. Modified Tables
    - `tasks`
      - Added `task_files` (jsonb) - array of { name, path } objects for multiple attachments

  This allows admins to attach more than one file per task.
  The existing file_name/file_path columns are kept for backwards compatibility.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'task_files'
  ) THEN
    ALTER TABLE tasks ADD COLUMN task_files jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
