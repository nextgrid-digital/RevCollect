ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS currency text;
