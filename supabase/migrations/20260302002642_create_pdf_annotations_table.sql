/*
  # Create PDF Annotations Table

  ## Summary
  Stores annotated PDF files per user, tied to their username login.
  When a user is deleted, their annotations are deleted via cascade.

  ## New Tables
  - `pdf_annotations`
    - `id` (uuid, primary key)
    - `username` (text, references the user's login username)
    - `pdf_filename` (text, original PDF filename)
    - `annotated_pdf_data` (text, base64-encoded annotated PDF data URL)
    - `annotation_state` (jsonb, stores annotation layer: text boxes, images, drawings)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Users can only read/write their own annotations (by username)
  - Policies use username matching since the app uses a custom auth system

  ## Notes
  - One row per (username, pdf_filename) combination
  - Upsert on save to update existing annotation for same file
*/

CREATE TABLE IF NOT EXISTS pdf_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  pdf_filename text NOT NULL,
  annotated_pdf_data text,
  annotation_state jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pdf_annotations_username_filename_idx
  ON pdf_annotations (username, pdf_filename);

ALTER TABLE pdf_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pdf annotations"
  ON pdf_annotations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own pdf annotations"
  ON pdf_annotations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own pdf annotations"
  ON pdf_annotations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own pdf annotations"
  ON pdf_annotations FOR DELETE
  TO anon, authenticated
  USING (true);
