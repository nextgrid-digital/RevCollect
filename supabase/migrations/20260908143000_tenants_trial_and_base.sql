-- Trial clock and base-plan flag for $49 workspace + $39 Agent.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS base_subscribed boolean NOT NULL DEFAULT false;

UPDATE tenants
SET trial_started_at = COALESCE(trial_started_at, created_at, now())
WHERE trial_started_at IS NULL;
