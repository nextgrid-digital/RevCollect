ALTER TABLE IF EXISTS chase_runs RENAME TO ari_runs;

DROP POLICY IF EXISTS tenant_isolation_chase_runs ON ari_runs;
DROP POLICY IF EXISTS tenant_isolation_ari_runs ON ari_runs;
CREATE POLICY tenant_isolation_ari_runs ON ari_runs
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

ALTER INDEX IF EXISTS idx_chase_runs_tenant_ran RENAME TO idx_ari_runs_tenant_ran;
