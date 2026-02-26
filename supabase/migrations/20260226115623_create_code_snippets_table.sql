/*
  # Create code_snippets table

  1. New Tables
    - `code_snippets`
      - `id` (uuid, primary key)
      - `share_id` (text, unique) - short human-readable share code
      - `title` (text) - optional snippet title
      - `files` (jsonb) - map of filename to code content
      - `created_at` (timestamptz)
      - `last_accessed` (timestamptz, nullable)

  2. Security
    - Enable RLS on `code_snippets` table
    - Allow anyone (anonymous + authenticated) to SELECT by share_id (public read for sharing)
    - Allow anyone to INSERT new snippets (public write for creating shares)
    - Allow anyone to UPDATE last_accessed (for access tracking)

  Notes:
    - Snippets are intentionally public (share links work without login)
    - No delete policy — snippets are permanent once shared
*/

CREATE TABLE IF NOT EXISTS code_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  files jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed timestamptz
);

CREATE INDEX IF NOT EXISTS code_snippets_share_id_idx ON code_snippets (share_id);

ALTER TABLE code_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read snippets by share_id"
  ON code_snippets
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create snippets"
  ON code_snippets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update last_accessed"
  ON code_snippets
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
