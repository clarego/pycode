/*
  # Add feedback column to task_submissions

  ## Summary
  Admins need to provide feedback/grades on student submissions.
  Adding a feedback text column that stores the admin's comments or grade.

  ## Changes
  - `task_submissions`
    - Add `feedback` (text, nullable, default null)

  ## Notes
  - Students will be able to see feedback on their submissions
  - Admins write feedback when marking submissions as reviewed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'feedback'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN feedback text DEFAULT NULL;
  END IF;
END $$;