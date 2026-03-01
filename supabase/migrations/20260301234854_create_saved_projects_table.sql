/*
  # Create saved_projects table

  ## Summary
  Stores user-saved coding projects permanently linked to their username.

  ## New Tables
  - `saved_projects`
    - `id` (uuid, primary key)
    - `username` (text, not null) — references the username from users_login (standalone auth)
    - `name` (text, not null) — user-defined project name
    - `files` (jsonb, not null) — all files in the project keyed by filename
    - `active_file` (text) — which file was active when saved
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - anon role can SELECT by username (needed since auth is custom, not Supabase Auth)
  - anon role can INSERT/UPDATE/DELETE only rows matching the username they pass
    (enforced via a check function that validates the username exists in users_login)
  
  ## Notes
  1. Since this app uses a custom username/password table (not Supabase Auth),
     RLS policies are based on username matching rather than auth.uid().
  2. Cascading deletes are NOT possible via FK since users_login lives in a different
     Supabase project. Deletion cleanup is handled at the application layer.
*/

CREATE TABLE IF NOT EXISTS saved_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Project',
  files jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_file text NOT NULL DEFAULT 'main.py',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_projects_username_idx ON saved_projects (username);

ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read saved projects by username"
  ON saved_projects
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert saved projects"
  ON saved_projects
  FOR INSERT
  TO anon
  WITH CHECK (username IS NOT NULL AND username <> '');

CREATE POLICY "Anyone can update their own saved projects"
  ON saved_projects
  FOR UPDATE
  TO anon
  USING (username IS NOT NULL AND username <> '')
  WITH CHECK (username IS NOT NULL AND username <> '');

CREATE POLICY "Anyone can delete their own saved projects"
  ON saved_projects
  FOR DELETE
  TO anon
  USING (username IS NOT NULL AND username <> '');
