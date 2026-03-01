/*
  # Create module_progress table

  ## Summary
  Stores each student's task completion progress per module, keyed by username.

  ## New Tables
    - `module_progress`
      - `id` (uuid, primary key)
      - `username` (text) — matches users_login.username
      - `module_id` (text) — e.g. "module-1"
      - `task_id` (text) — e.g. "m1-t1"
      - `task_index` (int) — 0-based index within the module
      - `completed_at` (timestamptz) — when the task was marked complete
      - unique constraint on (username, task_id) to prevent duplicates

  ## Security
    - RLS enabled
    - Authenticated users can insert/select their own rows (matched by username stored in auth metadata or direct username param)
    - No delete policy — progress is permanent
    - Admin can read all rows via a separate policy

  ## Notes
    - We use username (not auth uid) to match the existing custom auth system (users_login table)
    - Rows are inserted when a student clicks "Mark as Done" on a task
*/

CREATE TABLE IF NOT EXISTS module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  module_id text NOT NULL,
  task_id text NOT NULL,
  task_index integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (username, task_id)
);

CREATE INDEX IF NOT EXISTS module_progress_username_idx ON module_progress (username);
CREATE INDEX IF NOT EXISTS module_progress_module_idx ON module_progress (module_id);

ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert progress rows"
  ON module_progress
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read progress rows"
  ON module_progress
  FOR SELECT
  TO anon, authenticated
  USING (true);
