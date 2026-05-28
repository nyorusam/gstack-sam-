-- Sam Venture: Projects Registry
-- Adds a projects hub table so all Sam Venture products are catalogued
-- in Supabase and can be linked from their own domain tables.
-- GBrain tables (pages, content_chunks, minion_jobs, etc.) are untouched.

CREATE TABLE IF NOT EXISTS projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'archived', 'development')),
  repo_url    TEXT,
  live_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug   ON projects(slug);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'projects_read'
  ) THEN
    CREATE POLICY "projects_read"   ON projects FOR SELECT USING (true);
    CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (true);
    CREATE POLICY "projects_update" ON projects FOR UPDATE USING (true);
  END IF;
END $$;

-- Seed ARIA as project #1
INSERT INTO projects (slug, name, description, status, repo_url)
VALUES (
  'aria-incident-response',
  'ARIA: Autonomous Incident Response Intelligence Agent',
  '5-agent pipeline for enterprise incident response using Claude Sonnet 4.6 + Gemini 2.5 Flash',
  'active',
  'https://github.com/nyorusam/gstack-sam-'
) ON CONFLICT (slug) DO NOTHING;
