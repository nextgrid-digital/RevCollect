-- RevCollect initial schema (design-only until backend sprint)
-- See docs/data-layer-and-compliance.md

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT 'Workspace',
  subscription_status text NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'trialing', 'cancelled', 'past_due')),
  cancelled_at timestamptz,
  retain_email_beyond_24mo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  external_id text,
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL DEFAULT '',
  avatar_url text,
  status text NOT NULL DEFAULT 'current',
  balance_cents integer NOT NULL DEFAULT 0,
  days_overdue integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, external_id)
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  external_id text,
  number text NOT NULL,
  amount_cents integer NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL,
  aging_bucket text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE inbox_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subject text NOT NULL,
  preview text NOT NULL DEFAULT '',
  received_at timestamptz NOT NULL,
  unread boolean NOT NULL DEFAULT true,
  channel text NOT NULL DEFAULT 'email',
  reply_intent text,
  reply_intent_label text,
  agent_draft_ready boolean NOT NULL DEFAULT false,
  suggested_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE thread_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  author text NOT NULL CHECK (author IN ('customer', 'agent')),
  from_address text NOT NULL,
  to_addresses text[] NOT NULL DEFAULT '{}',
  cc_addresses text[] NOT NULL DEFAULT '{}',
  subject text NOT NULL,
  body_ciphertext bytea,
  body_nonce bytea,
  sent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  thread_email_id uuid NOT NULL REFERENCES thread_emails(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  occurred_at timestamptz NOT NULL,
  thread_email_id uuid REFERENCES thread_emails(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE agent_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  title text NOT NULL,
  body_ciphertext bytea,
  body_nonce bytea,
  tone text NOT NULL DEFAULT 'professional',
  prepared_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agent_config (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  tone text NOT NULL DEFAULT 'professional',
  auto_send_enabled boolean NOT NULL DEFAULT false,
  escalation_rules text NOT NULL DEFAULT '',
  signature text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  connected boolean NOT NULL DEFAULT false,
  label text NOT NULL,
  detail text,
  credentials_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip inet,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  completed_at timestamptz,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by text NOT NULL,
  scope text NOT NULL DEFAULT 'tenant'
    CHECK (scope IN ('tenant', 'customer')),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_invoices_tenant_customer ON invoices(tenant_id, customer_id);
CREATE INDEX idx_inbox_threads_tenant ON inbox_threads(tenant_id);
CREATE INDEX idx_thread_emails_tenant_thread ON thread_emails(tenant_id, thread_id);
CREATE INDEX idx_timeline_events_tenant_customer ON timeline_events(tenant_id, customer_id);
CREATE INDEX idx_audit_log_tenant_created ON audit_log(tenant_id, created_at DESC);
