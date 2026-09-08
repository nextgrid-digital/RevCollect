-- Stripe SaaS billing for the Collections Agent add-on.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS agent_addon_subscribed boolean NOT NULL DEFAULT false;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS tenants_stripe_customer_uidx
  ON tenants (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
