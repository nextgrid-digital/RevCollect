-- Canonical AR store: tenant keyed to the signed-in Supabase user until org mapping exists.
-- Intelligence lives in Postgres (patterns SQL, situations/preferences JSONB). Eve reads this store.

-- clerk_org_id exists only on the design-only initial schema. Skip if the live table never had it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'clerk_org_id'
  ) THEN
    ALTER TABLE tenants ALTER COLUMN clerk_org_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS owner_user_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS supabase_user_id uuid UNIQUE;

CREATE INDEX IF NOT EXISTS idx_tenants_owner_user ON tenants (owner_user_id);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS relationship_state text NOT NULL DEFAULT 'normal'
    CHECK (relationship_state IN ('normal', 'sensitive', 'paused')),
  ADD COLUMN IF NOT EXISTS follow_up_state text NOT NULL DEFAULT 'idle'
    CHECK (follow_up_state IN ('idle', 'queued', 'sent', 'waiting', 'paused')),
  ADD COLUMN IF NOT EXISTS intelligence jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS issue_date date,
  ADD COLUMN IF NOT EXISTS paid_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xero_status text,
  ADD COLUMN IF NOT EXISTS amount_due_cents integer;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_tenant_external_uidx
  ON invoices (tenant_id, external_id)
  WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices (id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  paid_at timestamptz NOT NULL,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, external_id)
);

ALTER TABLE agent_config
  ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

ALTER TABLE agent_drafts
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS body_text text;

CREATE TABLE IF NOT EXISTS chase_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  ran_at timestamptz NOT NULL DEFAULT now(),
  hour_label text NOT NULL DEFAULT '',
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chase_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
CREATE POLICY tenant_isolation_payments ON payments
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_chase_runs ON chase_runs;
CREATE POLICY tenant_isolation_chase_runs ON chase_runs
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_owner_all ON tenants;
CREATE POLICY tenant_owner_all ON tenants
  FOR ALL
  USING (owner_user_id = auth.uid() OR id = current_tenant_id())
  WITH CHECK (owner_user_id = auth.uid() OR id = current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_payments_tenant_customer ON payments (tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_chase_runs_tenant_ran ON chase_runs (tenant_id, ran_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_intelligence ON customers USING gin (intelligence);
