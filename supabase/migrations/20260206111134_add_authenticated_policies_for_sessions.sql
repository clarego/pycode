/*
  # Allow authenticated users to use coding sessions

  The existing policies only grant access to the `anon` role. 
  Authenticated users (logged-in students) also need to create 
  coding sessions and snapshots when submitting task work.

  1. Security Changes
    - Add INSERT policy for authenticated users on coding_sessions
    - Add SELECT policy for authenticated users on coding_sessions
    - Add INSERT policy for authenticated users on session_snapshots
    - Add SELECT policy for authenticated users on session_snapshots
*/

CREATE POLICY "Authenticated users can submit coding sessions"
  ON coding_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (share_id IS NOT NULL AND share_id != '');

CREATE POLICY "Authenticated users can view coding sessions"
  ON coding_sessions
  FOR SELECT
  TO authenticated
  USING (share_id IS NOT NULL);

CREATE POLICY "Authenticated users can submit snapshots"
  ON session_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coding_sessions WHERE coding_sessions.id = session_snapshots.session_id
    )
  );

CREATE POLICY "Authenticated users can view snapshots"
  ON session_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coding_sessions WHERE coding_sessions.id = session_snapshots.session_id
    )
  );
