/*
# Add user ownership — step 2: set defaults, NOT NULL, and update RLS policies

1. Set user_id columns to NOT NULL DEFAULT auth.uid()
2. Update all RLS policies from anon+public to authenticated-only with ownership checks
3. Add build settings columns (build_command, output_directory, install_command, root_directory)
*/

ALTER TABLE projects ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE deployments ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE env_vars ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE domains ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE activity ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Replace all policies with authenticated-only ownership checks
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_select_deployments" ON deployments;
DROP POLICY IF EXISTS "anon_insert_deployments" ON deployments;
DROP POLICY IF EXISTS "anon_update_deployments" ON deployments;
DROP POLICY IF EXISTS "anon_delete_deployments" ON deployments;
CREATE POLICY "select_own_deployments" ON deployments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_deployments" ON deployments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_deployments" ON deployments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_deployments" ON deployments FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_select_env_vars" ON env_vars;
DROP POLICY IF EXISTS "anon_insert_env_vars" ON env_vars;
DROP POLICY IF EXISTS "anon_update_env_vars" ON env_vars;
DROP POLICY IF EXISTS "anon_delete_env_vars" ON env_vars;
CREATE POLICY "select_own_env_vars" ON env_vars FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_env_vars" ON env_vars FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_env_vars" ON env_vars FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_env_vars" ON env_vars FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_select_domains" ON domains;
DROP POLICY IF EXISTS "anon_insert_domains" ON domains;
DROP POLICY IF EXISTS "anon_update_domains" ON domains;
DROP POLICY IF EXISTS "anon_delete_domains" ON domains;
CREATE POLICY "select_own_domains" ON domains FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_domains" ON domains FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_domains" ON domains FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_domains" ON domains FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_select_activity" ON activity;
DROP POLICY IF EXISTS "anon_insert_activity" ON activity;
DROP POLICY IF EXISTS "anon_delete_activity" ON activity;
CREATE POLICY "select_own_activity" ON activity FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_activity" ON activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_activity" ON activity FOR DELETE TO authenticated USING (auth.uid() = user_id);
