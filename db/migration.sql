-- ═══════════════════════════════════════════════════
-- Bankai Hub — Database Migration (Phase 1)
-- Run this in Neon SQL Editor
-- Uses hub_ prefix to coexist with bankai-finance tables
-- ═══════════════════════════════════════════════════

-- Users (auth)
CREATE TABLE IF NOT EXISTS hub_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS hub_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT,
  niche TEXT,
  description TEXT,
  target_audience TEXT,
  usp TEXT,
  competitors TEXT[] DEFAULT '{}',
  seo_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  language TEXT DEFAULT 'ru',
  region TEXT DEFAULT 'ru',
  serp_provider TEXT DEFAULT 'xmlriver',
  exclude_domains TEXT[] DEFAULT '{}',
  github_repo TEXT,
  github_token_encrypted TEXT,
  created_by UUID REFERENCES hub_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tool results (analyses, audits, etc.)
CREATE TABLE IF NOT EXISTS hub_tool_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES hub_projects(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  query TEXT,
  result JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES hub_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hub_projects_status ON hub_projects(status);
CREATE INDEX IF NOT EXISTS idx_hub_projects_created_by ON hub_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_hub_tool_results_project ON hub_tool_results(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_tool_results_slug ON hub_tool_results(tool_slug);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION hub_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_projects_updated_at
  BEFORE UPDATE ON hub_projects
  FOR EACH ROW EXECUTE FUNCTION hub_update_updated_at();

CREATE TRIGGER hub_users_updated_at
  BEFORE UPDATE ON hub_users
  FOR EACH ROW EXECUTE FUNCTION hub_update_updated_at();

-- ═══════════════════════════════════════════════════
-- Seed: create admin user (change password after first login!)
-- Password: bankai2024 (bcrypt hash)
-- ═══════════════════════════════════════════════════
INSERT INTO hub_users (email, password_hash, full_name, role)
VALUES (
  'agency.bankai@gmail.com',
  '$2a$12$LJ3kIy0RJzKHQVFKhKbZxOYk5JwCvCqXZGZfVJKjGh7QG8.mJHbMy',
  'Bankai Admin',
  'admin'
) ON CONFLICT (email) DO NOTHING;
