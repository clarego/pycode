/*
  # Create Shared Link Folders

  Adds a folder system to categorise shared links in the admin dashboard.

  ## New Tables

  ### `shared_link_folders`
  - `id` (uuid, primary key)
  - `name` (text) — display name
  - `parent_id` (uuid, nullable) — self-referencing FK for subfolders; NULL = top-level folder
  - `position` (integer) — ordering within same parent level
  - `created_at` (timestamptz)

  ## Modified Tables

  ### `code_snippets`
  - Adds `folder_id` (uuid, nullable) — FK to shared_link_folders; NULL = unfoldered (root)

  ## Security
  - RLS enabled on `shared_link_folders`
  - Authenticated users (admins) can perform all operations
  - Anon cannot access folders
*/

CREATE TABLE IF NOT EXISTS shared_link_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'New Folder',
  parent_id uuid REFERENCES shared_link_folders(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_link_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select folders"
  ON shared_link_folders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert folders"
  ON shared_link_folders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update folders"
  ON shared_link_folders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete folders"
  ON shared_link_folders FOR DELETE
  TO authenticated
  USING (true);

-- Add folder_id to code_snippets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_snippets' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE code_snippets ADD COLUMN folder_id uuid REFERENCES shared_link_folders(id) ON DELETE SET NULL;
  END IF;
END $$;
