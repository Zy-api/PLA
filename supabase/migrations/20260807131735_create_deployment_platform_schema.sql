/*
# Deployment Platform Schema (single-tenant, no auth)

1. New Tables
- `projects`: id, name, framework, repo_url, branch, status, created_at, updated_at
- `deployments`: id, project_id, status, commit_sha, commit_message, author, url, created_at, finished_at, build_duration_ms
- `env_vars`: id, project_id, key, value, created_at
- `domains`: id, project_id, domain, verified, created_at
- `activity`: id, project_id, event_type, event_data, created_at
2. Security
- RLS enabled on all tables.
- anon + authenticated CRUD allowed (single-tenant, intentionally shared data).
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  framework text NOT NULL DEFAULT 'vite',
  repo_url text,
  branch text NOT NULL DEFAULT 'main',
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  commit_sha text,
  commit_message text,
  author text,
  url text,
  build_duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_deployments" ON deployments;
CREATE POLICY "anon_select_deployments" ON deployments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_deployments" ON deployments;
CREATE POLICY "anon_insert_deployments" ON deployments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_deployments" ON deployments;
CREATE POLICY "anon_update_deployments" ON deployments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_deployments" ON deployments;
CREATE POLICY "anon_delete_deployments" ON deployments FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS env_vars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE env_vars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_env_vars" ON env_vars;
CREATE POLICY "anon_select_env_vars" ON env_vars FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_env_vars" ON env_vars;
CREATE POLICY "anon_insert_env_vars" ON env_vars FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_env_vars" ON env_vars;
CREATE POLICY "anon_update_env_vars" ON env_vars FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_env_vars" ON env_vars;
CREATE POLICY "anon_delete_env_vars" ON env_vars FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_domains" ON domains;
CREATE POLICY "anon_select_domains" ON domains FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_domains" ON domains;
CREATE POLICY "anon_insert_domains" ON domains FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_domains" ON domains;
CREATE POLICY "anon_update_domains" ON domains FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_domains" ON domains;
CREATE POLICY "anon_delete_domains" ON domains FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_activity" ON activity;
CREATE POLICY "anon_select_activity" ON activity FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity" ON activity;
CREATE POLICY "anon_insert_activity" ON activity FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity" ON activity;
CREATE POLICY "anon_delete_activity" ON activity FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_env_vars_project_id ON env_vars(project_id);
CREATE INDEX IF NOT EXISTS idx_domains_project_id ON domains(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_project_id ON activity(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments(created_at DESC);
