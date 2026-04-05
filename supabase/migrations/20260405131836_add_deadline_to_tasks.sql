/*
  # Add deadline to tasks table

  ## Summary
  Adds an optional `deadline` column to the `tasks` table so admins can set and update
  due dates for tasks. Students will see overdue tasks highlighted.

  ## Changes
  - `tasks` table: new nullable `deadline` column (timestamptz)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE tasks ADD COLUMN deadline timestamptz DEFAULT NULL;
  END IF;
END $$;
