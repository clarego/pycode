/*
  # Fix shared_link_folders RLS to allow anon role

  ## Problem
  The app uses a custom auth system (not Supabase Auth), so all Supabase client
  requests are made as the `anon` role. The existing folder policies only grant
  access to the `authenticated` role, which means admin users cannot create,
  read, update, or delete folders.

  ## Changes
  - Drop the four existing `authenticated`-only policies
  - Re-create them with both `anon` and `authenticated` roles
*/

DROP POLICY IF EXISTS "Authenticated users can select folders" ON shared_link_folders;
DROP POLICY IF EXISTS "Authenticated users can insert folders" ON shared_link_folders;
DROP POLICY IF EXISTS "Authenticated users can update folders" ON shared_link_folders;
DROP POLICY IF EXISTS "Authenticated users can delete folders" ON shared_link_folders;

CREATE POLICY "Anyone can select folders"
  ON shared_link_folders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert folders"
  ON shared_link_folders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update folders"
  ON shared_link_folders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete folders"
  ON shared_link_folders FOR DELETE
  TO anon, authenticated
  USING (true);
