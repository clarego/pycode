/*
  # Create coding sessions and snapshots tables

  1. New Tables
    - `coding_sessions`
      - `id` (uuid, primary key)
      - `share_id` (text, unique) - short code for the review link
      - `duration_ms` (integer) - total session duration in milliseconds
      - `active_file` (text) - the last active file name
      - `created_at` (timestamptz)
    - `session_snapshots`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key -> coding_sessions)
      - `timestamp_ms` (integer) - milliseconds since session start
      - `files` (jsonb) - full file contents at this point
      - `active_file` (text) - which file was active
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Allow anonymous inserts for student submissions
    - Allow anonymous reads for teacher review via share link
    - Block updates and deletes

  3. Indexes
    - Index on session_snapshots.session_id for fast lookups
    - Index on session_snapshots.timestamp_ms for ordered retrieval
    - Index on coding_sessions.share_id for link lookups
*/

CREATE TABLE IF NOT EXISTS coding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id text UNIQUE NOT NULL,
  duration_ms integer NOT NULL DEFAULT 0,
  active_file text NOT NULL DEFAULT 'main.py',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES coding_sessions(id),
  timestamp_ms integer NOT NULL,
  files jsonb NOT NULL,
  active_file text NOT NULL DEFAULT 'main.py',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_snapshots_session_id
  ON session_snapshots(session_id);

CREATE INDEX IF NOT EXISTS idx_session_snapshots_timestamp
  ON session_snapshots(session_id, timestamp_ms);

CREATE INDEX IF NOT EXISTS idx_coding_sessions_share_id
  ON coding_sessions(share_id);

ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a coding session"
  ON coding_sessions
  FOR INSERT
  TO anon
  WITH CHECK (share_id IS NOT NULL AND share_id != '');

CREATE POLICY "Anyone can view coding sessions by share link"
  ON coding_sessions
  FOR SELECT
  TO anon
  USING (share_id IS NOT NULL);

CREATE POLICY "Anyone can submit session snapshots"
  ON session_snapshots
  FOR INSERT
  TO anon
  WITH CHECK (
    session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coding_sessions WHERE coding_sessions.id = session_snapshots.session_id
    )
  );

CREATE POLICY "Anyone can view snapshots for accessible sessions"
  ON session_snapshots
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM coding_sessions WHERE coding_sessions.id = session_snapshots.session_id
    )
  );
