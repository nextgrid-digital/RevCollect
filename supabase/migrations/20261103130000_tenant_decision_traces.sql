-- Playground decision traces for the signed-in tenant. No prompts are logged outside this row.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS decision_traces jsonb NOT NULL DEFAULT '[]'::jsonb;
