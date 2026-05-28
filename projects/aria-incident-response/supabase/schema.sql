-- ARIA: Autonomous Incident Response Intelligence Agent
-- ============================================================
-- PREREQUISITE: Run supabase/schema.sql (root) first to create
-- the `projects` table and seed the ARIA project row.
-- ============================================================
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zghdvjwzdvqhgltrirrm/sql
-- ============================================================
-- GBrain core tables are untouched.
-- ============================================================

-- incidents: incoming enterprise alerts
-- project_id links to the projects registry (projects table, root schema)
CREATE TABLE IF NOT EXISTS incidents (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID        REFERENCES projects(id) ON DELETE SET NULL,
  type       TEXT        NOT NULL CHECK (type IN ('database','security','api','compliance','service')),
  severity   TEXT        NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  source     TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  raw_data   JSONB       NOT NULL DEFAULT '{}',
  status     TEXT        NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open','triaged','investigating','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- agent_runs: execution record for each of the 5 agents per incident
CREATE TABLE IF NOT EXISTS agent_runs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id    UUID        NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  agent_name     TEXT        NOT NULL CHECK (agent_name IN ('monitor','triage','investigate','respond','audit')),
  model          TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','running','done','error')),
  input          JSONB       NOT NULL DEFAULT '{}',
  output         JSONB,
  chain_of_thought TEXT,
  duration_ms    INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- actions: what ARIA's respond agent decides to do
CREATE TABLE IF NOT EXISTS actions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID        NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action_type TEXT        NOT NULL CHECK (action_type IN ('ticket','notification','runbook','escalation')),
  priority    TEXT        NOT NULL CHECK (priority IN ('immediate','urgent','normal')),
  assignee    TEXT,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- audit_log: immutable record — INSERT only, never UPDATE or DELETE
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID        NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  event       TEXT        NOT NULL,
  actor       TEXT        NOT NULL,
  details     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_project   ON incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status    ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity  ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_agent_runs_incident ON agent_runs(incident_id);
CREATE INDEX IF NOT EXISTS idx_actions_incident    ON actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_incident  ON audit_log(incident_id);

-- Enable Supabase Realtime for live UI updates
ALTER TABLE incidents  REPLICA IDENTITY FULL;
ALTER TABLE agent_runs REPLICA IDENTITY FULL;
ALTER TABLE actions    REPLICA IDENTITY FULL;

-- Row Level Security (open for hackathon)
ALTER TABLE incidents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='incidents' AND policyname='aria_read') THEN
    CREATE POLICY "aria_read"   ON incidents  FOR SELECT USING (true);
    CREATE POLICY "aria_insert" ON incidents  FOR INSERT WITH CHECK (true);
    CREATE POLICY "aria_update" ON incidents  FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_runs' AND policyname='aria_read') THEN
    CREATE POLICY "aria_read"   ON agent_runs FOR SELECT USING (true);
    CREATE POLICY "aria_insert" ON agent_runs FOR INSERT WITH CHECK (true);
    CREATE POLICY "aria_update" ON agent_runs FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='actions' AND policyname='aria_read') THEN
    CREATE POLICY "aria_read"   ON actions    FOR SELECT USING (true);
    CREATE POLICY "aria_insert" ON actions    FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_log' AND policyname='aria_read') THEN
    CREATE POLICY "aria_read"   ON audit_log  FOR SELECT USING (true);
    CREATE POLICY "aria_insert" ON audit_log  FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Backfill project_id on existing incidents rows
-- (safe to run multiple times — only sets rows where project_id is NULL)
UPDATE incidents
SET project_id = (SELECT id FROM projects WHERE slug = 'aria-incident-response' LIMIT 1)
WHERE project_id IS NULL;

-- Verify
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('projects','incidents','agent_runs','actions','audit_log');
