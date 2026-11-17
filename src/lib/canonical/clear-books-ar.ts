/**
 * Disconnect keeps the ledger snapshot. Callers used to wipe customers, invoices,
 * and threads here. That data stays so a dropped connection can be shown as old.
 */
export async function clearBooksAr(_tenantId: string): Promise<void> {
  return;
}
