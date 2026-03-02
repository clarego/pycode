/*
  # Add binary_files and active_file columns to code_snippets

  1. Changes
    - `code_snippets` table:
      - Add `binary_files` (jsonb) - stores base64-encoded binary files (PDFs, images) keyed by filename
      - Add `active_file` (text) - stores the active/selected file when the snippet was shared

  2. Notes
    - binary_files defaults to empty object to maintain backward compatibility
    - active_file defaults to null (callers fall back to first file or 'main.py')
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_snippets' AND column_name = 'binary_files'
  ) THEN
    ALTER TABLE code_snippets ADD COLUMN binary_files jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_snippets' AND column_name = 'active_file'
  ) THEN
    ALTER TABLE code_snippets ADD COLUMN active_file text DEFAULT NULL;
  END IF;
END $$;
