ALTER TABLE inbox_threads
  ADD COLUMN IF NOT EXISTS public_id uuid;

UPDATE inbox_threads
SET public_id = gen_random_uuid()
WHERE public_id IS NULL;

ALTER TABLE inbox_threads
  ALTER COLUMN public_id SET DEFAULT gen_random_uuid();

ALTER TABLE inbox_threads
  ALTER COLUMN public_id SET NOT NULL;
