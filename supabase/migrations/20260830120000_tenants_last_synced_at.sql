ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
