-- Relationship policy lives on customers as jsonb. Expand relationship_state for the P0 safety states.

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_relationship_state_check;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS relationship_policy jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE customers
  ADD CONSTRAINT customers_relationship_state_check
  CHECK (
    relationship_state IN (
      'normal',
      'sensitive',
      'paused',
      'sensitive_event',
      'active_dispute',
      'payment_claimed',
      'paused_until_date',
      'manual_only',
      'founder_only',
      'do_not_contact',
      'resume_review'
    )
  );
