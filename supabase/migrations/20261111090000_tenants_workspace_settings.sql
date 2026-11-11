ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS workspace_settings jsonb NOT NULL DEFAULT '{}'::jsonb;
