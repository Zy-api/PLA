import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Project = {
  id: string;
  name: string;
  framework: string;
  repo_url: string | null;
  branch: string;
  status: string;
  created_at: string;
  updated_at: string;
  build_command: string | null;
  output_directory: string | null;
  install_command: string | null;
  root_directory: string | null;
};

export type Deployment = {
  id: string;
  project_id: string;
  status: string;
  commit_sha: string | null;
  commit_message: string | null;
  author: string | null;
  url: string | null;
  build_duration_ms: number | null;
  created_at: string;
  finished_at: string | null;
};

export type EnvVar = {
  id: string;
  project_id: string;
  key: string;
  value: string;
  created_at: string;
};

export type Domain = {
  id: string;
  project_id: string;
  domain: string;
  verified: boolean;
  created_at: string;
};

export type Activity = {
  id: string;
  project_id: string | null;
  event_type: string;
  event_data: string | null;
  created_at: string;
};
