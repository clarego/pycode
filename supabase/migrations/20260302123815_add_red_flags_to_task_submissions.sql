/*
  # Add red_flags column to task_submissions

  ## Summary
  When students submit work, the system logs suspicious activity like large
  pastes or bulk text insertions. This column stores a summary array of
  red flag events so admins can see them at a glance on the submissions table.

  ## Changes
  - `task_submissions`
    - Add `red_flags` (jsonb, default '[]')
    
  ## Structure of red_flags array
  Each entry: { type: 'paste'|'bulk_insert', chars: number, timestamp_ms: number, file: string }
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'red_flags'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN red_flags jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
