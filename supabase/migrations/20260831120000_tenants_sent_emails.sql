-- Persist outbound collection emails on the tenant so they survive Xero ingest.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS sent_emails jsonb NOT NULL DEFAULT '[]'::jsonb;
