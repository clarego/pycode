/*
  # Allow admins to read all PDF annotations

  ## Changes
  - Adds a SELECT policy on pdf_annotations allowing authenticated users with is_admin = true
    (via app_metadata JWT claim) to read any annotation row, enabling the admin marking workflow.

  ## Security
  - Only users whose JWT contains app_metadata.is_admin = true can use this policy.
  - Non-admin authenticated users can only read their own rows (existing policy).
*/

CREATE POLICY "Admins can read all pdf annotations"
  ON pdf_annotations FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );
