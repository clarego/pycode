/*
  # Add saved_code to module_progress

  ## Summary
  Stores the student's code at the time they marked a task as complete.

  ## Changes
    - `module_progress` table:
      - New column `saved_code` (text, nullable) — the code the student wrote for the task

  ## Notes
    - Nullable so existing rows are not affected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'module_progress' AND column_name = 'saved_code'
  ) THEN
    ALTER TABLE module_progress ADD COLUMN saved_code text;
  END IF;
END $$;
