-- Encrypted OAuth tokens for Xero/Gmail (server-only via service role)

CREATE TABLE IF NOT EXISTS integration_secrets (
  tenant_key text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('xero', 'gmail')),
  secret jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, provider)
);

ALTER TABLE integration_secrets ENABLE ROW LEVEL SECURITY;
