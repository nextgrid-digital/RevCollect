-- Row Level Security policies (design-only until backend sprint)

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Server Actions set: SET LOCAL app.tenant_id = '<uuid>';
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- Tenant-scoped tables: full isolation
CREATE POLICY tenant_isolation_customers ON customers
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_invoices ON invoices
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_inbox_threads ON inbox_threads
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_thread_emails ON thread_emails
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_email_attachments ON email_attachments
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_timeline_events ON timeline_events
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_agent_drafts ON agent_drafts
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_agent_config ON agent_config
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_integration_connections ON integration_connections
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Audit log: insert + select only (append-only)
CREATE POLICY tenant_select_audit_log ON audit_log
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_insert_audit_log ON audit_log
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Privacy workflow tables
CREATE POLICY tenant_isolation_data_export_requests ON data_export_requests
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_deletion_requests ON deletion_requests
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Tenants: users can only read their own tenant row
CREATE POLICY tenant_self_read ON tenants
  FOR SELECT USING (id = current_tenant_id());
