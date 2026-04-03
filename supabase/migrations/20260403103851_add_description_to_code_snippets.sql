/*
  # Add description column to code_snippets

  1. Changes
    - Adds `description` (text) column to `code_snippets` table
      - Allows admins and owners to annotate shared links with a human-readable description
      - Defaults to empty string so existing rows are unaffected

  2. Notes
    - Purely additive change; no data loss possible
    - No RLS changes needed — existing update policies already cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_snippets' AND column_name = 'description'
  ) THEN
    ALTER TABLE code_snippets ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;
END $$;
