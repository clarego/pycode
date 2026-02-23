/*
  # Add student name to coding sessions

  1. Modified Tables
    - `coding_sessions`
      - Add `student_name` (text) - the name of the student who submitted the session

  2. Notes
    - Uses IF NOT EXISTS check to safely add the column
    - Default empty string so existing rows are unaffected
    - Data is persistent with no expiry - links work forever
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coding_sessions' AND column_name = 'student_name'
  ) THEN
    ALTER TABLE coding_sessions ADD COLUMN student_name text NOT NULL DEFAULT '';
  END IF;
END $$;
