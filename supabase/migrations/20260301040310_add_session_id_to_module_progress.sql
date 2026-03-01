/*
  # Link coding sessions to module progress

  ## Summary
  Adds session tracking to module task work so admins can review a student's
  coding process (playback) for each task.

  ## Changes

  ### Modified Tables
  - `module_progress`
    - New column `session_share_id` (text, nullable): stores the share_id of the
      coding_session recorded while the student worked on this task. Allows the
      admin to click through to a playback view.

  ### No security changes
  - Existing RLS policies remain unchanged; the new column inherits the same access rules.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'module_progress' AND column_name = 'session_share_id'
  ) THEN
    ALTER TABLE module_progress ADD COLUMN session_share_id text DEFAULT NULL;
  END IF;
END $$;
