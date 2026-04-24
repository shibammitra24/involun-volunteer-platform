-- ============================================================
-- InVolun – Initial Schema
-- Run this in your Supabase SQL Editor to create all tables.
-- ============================================================

-- -------------------------------------------------------
-- ENUMS
-- -------------------------------------------------------
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE need_status    AS ENUM ('open', 'assigned', 'completed');
CREATE TYPE assign_status  AS ENUM ('pending', 'accepted', 'rejected', 'completed');

-- -------------------------------------------------------
-- NEEDS
-- -------------------------------------------------------
CREATE TABLE needs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  raw_description TEXT        NOT NULL,
  ai_summary      TEXT,
  urgency         urgency_level NOT NULL DEFAULT 'medium',
  category        TEXT,
  location        TEXT,
  status          need_status   NOT NULL DEFAULT 'open',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_needs_status   ON needs (status);
CREATE INDEX idx_needs_urgency  ON needs (urgency);
CREATE INDEX idx_needs_category ON needs (category);

-- -------------------------------------------------------
-- VOLUNTEERS
-- -------------------------------------------------------
CREATE TABLE volunteers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  skills       TEXT[]      NOT NULL DEFAULT '{}',
  availability TEXT,
  location     TEXT,
  is_available BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_volunteers_available ON volunteers (is_available);
CREATE INDEX idx_volunteers_skills    ON volunteers USING GIN (skills);

-- -------------------------------------------------------
-- ASSIGNMENTS
-- -------------------------------------------------------
CREATE TABLE assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id      UUID          NOT NULL REFERENCES needs(id)      ON DELETE CASCADE,
  volunteer_id UUID          NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  ai_reason    TEXT,
  status       assign_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_need      ON assignments (need_id);
CREATE INDEX idx_assignments_volunteer ON assignments (volunteer_id);
CREATE INDEX idx_assignments_status    ON assignments (status);

-- -------------------------------------------------------
-- ROW LEVEL SECURITY  (enabled, with permissive policies)
-- -------------------------------------------------------
ALTER TABLE needs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Allow full access for authenticated users (tighten later as needed)
CREATE POLICY "Allow all for authenticated" ON needs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON volunteers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON assignments
  FOR ALL USING (true) WITH CHECK (true);

-- Allow anonymous read access (for public-facing need listings)
CREATE POLICY "Allow anon read needs" ON needs
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert needs" ON needs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon read volunteers" ON volunteers
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert volunteers" ON volunteers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon read assignments" ON assignments
  FOR SELECT USING (true);
