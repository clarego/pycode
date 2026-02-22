/*
  # Fix code_snippets RLS and ensure all logged-in users can embed programs

  ## Changes

  1. Fix share_id length check
     - Previous migration required LENGTH(share_id) >= 8 but the app generates 7-character share IDs
     - Drop the broken policy and replace with one that matches the actual generator (>= 6 chars)

  2. Ensure both authenticated and anonymous users can create snippets
     - Anonymous users (not logged in) can still share/embed
     - Authenticated users (all roles) can share/embed
     - Embedded snippets never expire (no TTL, no cleanup policy)

  3. Anyone can read snippets by share_id (already exists, confirmed)

  ## Notes
  - The `code_snippets` table stores the files JSONB and a unique share_id
  - Snippets are permanent — there is no expiry mechanism
  - The embed view at /embed/{share_id} is publicly accessible
*/

-- Fix the authenticated insert policy to match actual share_id length (7 chars from generator)
DROP POLICY IF EXISTS "Authenticated users can create code snippets" ON code_snippets;

CREATE POLICY "Authenticated users can create code snippets"
  ON code_snippets FOR INSERT TO authenticated
  WITH CHECK (
    share_id IS NOT NULL 
    AND share_id != ''
    AND LENGTH(share_id) >= 6
  );

-- Ensure anonymous users can also create snippets (for non-logged-in users)
DROP POLICY IF EXISTS "Anonymous can create code snippets" ON code_snippets;

CREATE POLICY "Anonymous can create code snippets"
  ON code_snippets FOR INSERT TO anon
  WITH CHECK (
    share_id IS NOT NULL 
    AND share_id != ''
    AND LENGTH(share_id) >= 6
  );
