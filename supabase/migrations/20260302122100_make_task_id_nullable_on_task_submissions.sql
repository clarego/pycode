/*
  # Make task_id nullable on task_submissions

  ## Summary
  Students can submit work from both the playground (no task) and from task pages.
  Playground submissions don't have a task_id. Making it nullable allows storing
  both types of submissions in one table.

  ## Changes
  - `task_submissions.task_id`: changed from NOT NULL to nullable
  - Drop and recreate the FK constraint to allow NULLs

  ## Notes
  - Existing rows with task_id remain unchanged
  - Playground submissions will have task_id = NULL
*/

ALTER TABLE task_submissions ALTER COLUMN task_id DROP NOT NULL;
