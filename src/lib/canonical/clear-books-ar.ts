import { getCanonicalStore } from './store';

/**
 * Wipe ledger AR from the canonical snapshot after books disconnect.
 * Also clears inbox + sent mail so switching QBO ↔ Zoho ↔ Xero does not
 * reattach the previous ledger’s Gmail threads by matching customer email.
 * Preserves agent config, workspace settings, and billing.
 * Gmail sync will re-import mail for the newly connected ledger’s customers.
 */
export async function clearBooksAr(tenantId: string): Promise<void> {
  const store = await getCanonicalStore();
  const current = await store.read(tenantId);
  await store.write(tenantId, {
    ...current,
    customers: [],
    invoices: [],
    payments: [],
    intelligenceByCustomerId: {},
    drafts: [],
    inboxMessages: [],
    sentEmails: [],
    ingestedAt: null
  });
}
