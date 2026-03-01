/*
  # Add chars_added and event columns to session_snapshots

  ## Summary
  The session_snapshots table is missing two columns that the application
  expects when saving coding session data:
  - chars_added: tracks how many characters were added in this snapshot
  - event: stores special event markers like 'paste' or 'bulk_insert'

  ## Changes
  - `session_snapshots`
    - Add `chars_added` (integer, default 0)
    - Add `event` (text, nullable)
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
    ALTER TABLE session_snapshots ADD COLUMN event text DEFAULT NULL;
  END IF;
END $$;
