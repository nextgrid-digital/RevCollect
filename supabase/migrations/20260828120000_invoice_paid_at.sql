ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS paid_at date;
