/*
# Add user ownership to deployment platform (multi-user with auth) — step 1: add nullable columns

1. New Columns (nullable, no default yet)
- projects.user_id, deployments.user_id, env_vars.user_id, domains.user_id, activity.user_id
- projects.build_command, projects.output_directory, projects.install_command, projects.root_directory
2. Indexes on user_id columns
*/

ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE env_vars ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS build_command text DEFAULT 'npm run build';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS output_directory text DEFAULT 'dist';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS install_command text DEFAULT 'npm install';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS root_directory text DEFAULT '/';

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_env_vars_user_id ON env_vars(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity(user_id);
