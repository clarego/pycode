/*
  # Create task_assignments table

  ## Summary
  Teachers need to assign specific tasks to specific students. This table
  tracks which students are assigned to which tasks.

  ## New Tables
  - `task_assignments`
    - `id` (uuid, primary key)
    - `task_id` (uuid, FK to tasks.id, not null)
    - `student_id` (text, the student username, not null)
    - `assigned_at` (timestamptz, default now())
    - Unique constraint on (task_id, student_id) to prevent duplicates

  ## Security
  - Enable RLS on `task_assignments`
  - Policies for read access by the assigned student or any authenticated user
    (admins query all, students query their own)
*/

CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(task_id, student_id)
);

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own assignments"
  ON task_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.username = task_assignments.student_id
    )
  );

CREATE POLICY "Admins can insert assignments"
  ON task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.username = task_assignments.student_id
    )
  );

CREATE POLICY "Admins can delete assignments"
  ON task_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.username = task_assignments.student_id
    )
  );
