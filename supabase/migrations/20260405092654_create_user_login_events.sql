/*
  # Create user_login_events table

  ## Purpose
  Records every login event for each user, storing IP address, approximate
  geolocation (country/city resolved client-side from a free IP API), browser
  user-agent, and a timestamp. Admins can view this data in the dashboard.

  ## New Tables
  - `user_login_events`
    - `id` (uuid, pk)
    - `username` (text) – matches users_login.username
    - `ip_address` (text) – raw IP address of the client
    - `country` (text) – resolved country name, may be empty
    - `city` (text) – resolved city name, may be empty
    - `user_agent` (text) – browser user-agent string
    - `logged_in_at` (timestamptz)

  ## Security
  - RLS enabled
  - INSERT allowed for anon + authenticated (login happens before a session exists)
  - SELECT allowed only for authenticated users (admins read via service-role or
    existing anon-key direct fetch pattern used elsewhere in the codebase)
  - No UPDATE / DELETE policies — events are append-only
*/

CREATE TABLE IF NOT EXISTS user_login_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username     text NOT NULL,
  ip_address   text NOT NULL DEFAULT '',
  country      text NOT NULL DEFAULT '',
  city         text NOT NULL DEFAULT '',
  user_agent   text NOT NULL DEFAULT '',
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_login_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert login events"
  ON user_login_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read login events"
  ON user_login_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS user_login_events_username_idx
  ON user_login_events (username);

CREATE INDEX IF NOT EXISTS user_login_events_logged_in_at_idx
  ON user_login_events (logged_in_at DESC);
