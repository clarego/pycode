/*
  # Create task submissions table

  1. New Tables
    - `task_submissions` - Student submissions for assigned tasks
      - `id` (uuid, PK)
      - `task_id` (uuid, references tasks)
      - `student_id` (uuid, references profiles)
      - `file_name` (text) - submitted file name
      - `file_path` (text) - storage path in submission-files bucket
      - `session_share_id` (text) - link to coding_sessions for playback
      - `submitted_at` (timestamptz)
      - `reviewed` (boolean) - admin review status

  2. Security
    - RLS enabled
    - Students can view/create their own submissions
    - Admins can view/update all submissions

  3. Indexes
    - task_id for per-task queries
    - student_id for per-student queries
*/

CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text,
  file_path text,
  session_share_id text,
  submitted_at timestamptz DEFAULT now(),
  reviewed boolean NOT NULL DEFAULT false,
  UNIQUE(task_id, student_id)
);

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions"
  ON task_submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all submissions"
  ON task_submissions FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Students can create own submissions"
  ON task_submissions FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'student'
  );

CREATE POLICY "Students can update own unreviewed submissions"
  ON task_submissions FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND reviewed = false)
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can update all submissions"
  ON task_submissions FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_student_id ON task_submissions(student_id);
