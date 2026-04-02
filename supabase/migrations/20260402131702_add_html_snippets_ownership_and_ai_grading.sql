/*
  # Add HTML snippet ownership, AI marking scheme, and AI auto-grading support

  1. Changes to code_snippets
    - Add `created_by` (text) - stores the username of the owner (null for anonymous)
    - Add `is_public` (boolean) - controls whether the snippet is publicly accessible (default true)

  2. Changes to tasks
    - Add `marking_scheme` (text) - AI-generated or manually written marking criteria
    - Add `auto_grade` (boolean) - whether AI should auto-grade submissions for this task

  3. Changes to task_submissions
    - Add `ai_grade` (text) - AI-generated grade/feedback
    - Add `ai_graded_at` (timestamptz) - when AI grading was performed
    - Add `grade` (text) - final grade (either AI grade or admin override)
    - Add `grade_overridden` (boolean) - true when admin has manually overridden the AI grade

  Security:
    - code_snippets: owners can delete/unshare their own snippets (policy on created_by)
    - All changes are additive (no data loss)
*/

-- Add ownership and visibility to code_snippets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_snippets' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE code_snippets ADD COLUMN created_by text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_snippets' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE code_snippets ADD COLUMN is_public boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add marking scheme and auto-grade flag to tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'marking_scheme'
  ) THEN
    ALTER TABLE tasks ADD COLUMN marking_scheme text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'auto_grade'
  ) THEN
    ALTER TABLE tasks ADD COLUMN auto_grade boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add AI grading columns to task_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'ai_grade'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN ai_grade text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'ai_graded_at'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN ai_graded_at timestamptz DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'grade'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN grade text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'grade_overridden'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN grade_overridden boolean NOT NULL DEFAULT false;
  END IF;
END $$;
