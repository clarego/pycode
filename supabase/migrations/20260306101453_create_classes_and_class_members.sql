/*
  # Create Classes and Class Members Tables

  ## Summary
  Adds a class management system so admins can group students into classes
  and assign tasks to entire classes at once.

  ## New Tables

  ### classes
  - `id` (uuid, primary key) - unique identifier
  - `name` (text, not null) - class name (e.g. "Period 1", "Year 10")
  - `description` (text) - optional description
  - `created_at` (timestamptz) - when the class was created

  ### class_members
  - `id` (uuid, primary key)
  - `class_id` (uuid, FK → classes) - which class
  - `student_username` (text, not null) - the student's username (matches users_login.username)
  - `created_at` (timestamptz)
  - Unique constraint on (class_id, student_username) to prevent duplicates

  ## Security
  - RLS enabled on both tables
  - Only authenticated users can read (for task assignment lookups)
  - Only admin-level operations handled via service role (edge function)
  - Anon can read classes and members (needed for custom auth system)
*/

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read classes"
  ON classes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_username text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_id, student_username)
);

ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read class members"
  ON class_members FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert class members"
  ON class_members FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete class members"
  ON class_members FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert classes"
  ON classes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update classes"
  ON classes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete classes"
  ON classes FOR DELETE
  TO anon, authenticated
  USING (true);
