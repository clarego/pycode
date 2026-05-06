/*
  # Add position column to code_snippets

  ## Summary
  Adds a nullable `position` integer column to `code_snippets` to support
  manual drag-to-reorder ordering of unfiled (no folder) snippets in the
  Shared Links admin panel.

  ## Changes
  - `code_snippets`: add `position` integer column (nullable, no default)

  ## Notes
  - Only used when folder_id IS NULL (unfiled snippets)
  - NULL position means the snippet falls back to created_at ordering
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_snippets' AND column_name = 'position'
  ) THEN
    ALTER TABLE code_snippets ADD COLUMN position integer;
  END IF;
END $$;
