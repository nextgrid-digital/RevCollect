-- Compliance functions (design-only until backend sprint)

CREATE SCHEMA IF NOT EXISTS private;

-- Cascade delete all tenant PII. Called 30 days after cancellation or on erasure request.
CREATE OR REPLACE FUNCTION private.delete_tenant(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  -- Child tables cascade via FK; explicit order for clarity
  DELETE FROM email_attachments WHERE tenant_id = p_tenant_id;
  DELETE FROM thread_emails WHERE tenant_id = p_tenant_id;
  DELETE FROM agent_drafts WHERE tenant_id = p_tenant_id;
  DELETE FROM inbox_threads WHERE tenant_id = p_tenant_id;
  DELETE FROM timeline_events WHERE tenant_id = p_tenant_id;
  DELETE FROM invoices WHERE tenant_id = p_tenant_id;
  DELETE FROM customers WHERE tenant_id = p_tenant_id;
  DELETE FROM integration_connections WHERE tenant_id = p_tenant_id;
  DELETE FROM agent_config WHERE tenant_id = p_tenant_id;
  DELETE FROM data_export_requests WHERE tenant_id = p_tenant_id;
  DELETE FROM deletion_requests WHERE tenant_id = p_tenant_id;

  -- Redact audit metadata; retain tombstone rows
  UPDATE audit_log
  SET metadata = jsonb_build_object('redacted', true)
  WHERE tenant_id = p_tenant_id;

  DELETE FROM tenants WHERE id = p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION private.delete_tenant(uuid) FROM PUBLIC;
-- Grant only to service role / migration role at deploy time

-- Purge email bodies older than 24 months unless tenant opted out
CREATE OR REPLACE FUNCTION private.purge_expired_email_content()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE thread_emails te
  SET body_ciphertext = NULL, body_nonce = NULL
  FROM tenants t
  WHERE te.tenant_id = t.id
    AND t.retain_email_beyond_24mo = false
    AND te.sent_at < now() - interval '24 months'
    AND te.body_ciphertext IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Purge tenants cancelled more than 30 days ago
CREATE OR REPLACE FUNCTION private.purge_cancelled_tenants()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  r record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT id FROM tenants
    WHERE subscription_status = 'cancelled'
      AND cancelled_at IS NOT NULL
      AND cancelled_at < now() - interval '30 days'
  LOOP
    PERFORM private.delete_tenant(r.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Schedule with pg_cron when backend sprint deploys:
-- SELECT cron.schedule('purge-cancelled-tenants', '0 3 * * *', $$SELECT private.purge_cancelled_tenants()$$);
-- SELECT cron.schedule('purge-expired-email-content', '0 4 * * *', $$SELECT private.purge_expired_email_content()$$);
