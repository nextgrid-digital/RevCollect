-- Allow QuickBooks and Zoho Books OAuth tokens next to Xero and Gmail.
-- Re-run safely if a previous attempt dropped the check but ADD failed (23514).

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'integration_secrets'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%provider%'
  LOOP
    EXECUTE format('ALTER TABLE public.integration_secrets DROP CONSTRAINT IF EXISTS %I', rec.conname);
  END LOOP;
END $$;

UPDATE public.integration_secrets
SET provider = lower(btrim(provider))
WHERE provider IS DISTINCT FROM lower(btrim(provider));

UPDATE public.integration_secrets SET provider = 'gmail' WHERE provider IN ('google', 'gsuite');
UPDATE public.integration_secrets SET provider = 'quickbooks' WHERE provider IN ('qbo', 'intuit', 'quickbook');
UPDATE public.integration_secrets SET provider = 'zoho' WHERE provider IN ('zoho_books', 'zohobooks', 'zoho-books');

-- Leftover keys cannot be read by the app; keeping them blocks the check.
DELETE FROM public.integration_secrets
WHERE provider NOT IN ('xero', 'gmail', 'quickbooks', 'zoho');

ALTER TABLE public.integration_secrets
  ADD CONSTRAINT integration_secrets_provider_check
  CHECK (provider IN ('xero', 'gmail', 'quickbooks', 'zoho'));
