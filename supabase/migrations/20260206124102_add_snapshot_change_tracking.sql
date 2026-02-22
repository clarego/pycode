/*
  # Add change tracking to session snapshots

  1. Modified Tables
    - `session_snapshots`
      - Added `chars_added` (integer) - number of characters added since previous snapshot
      - Added `event` (text) - event label such as 'paste' or 'bulk_insert' for flagging

  This enables admins to detect and flag suspicious activity like
  large code blocks suddenly appearing (copy-paste detection).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_snapshots' AND column_name = 'chars_added'
  ) THEN
    ALTER TABLE session_snapshots ADD COLUMN chars_added integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_snapshots' AND column_name = 'event'
  ) THEN
    ALTER TABLE session_snapshots ADD COLUMN event text;
  END IF;
END $$;
