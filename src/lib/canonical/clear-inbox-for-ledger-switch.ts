import { clearArDataMemo } from './ar-data-memo';
import { getCanonicalStore } from './store';

/**
 * Drop Gmail thread history when switching (or reconnecting) a books ledger.
 * Same customer email across QBO/Zoho/Xero must not reattach the previous
 * conversation. Gmail sync then only keeps mail at/after the new connection.
 */
export async function clearInboxForLedgerSwitch(tenantId: string): Promise<void> {
  const store = await getCanonicalStore();
  const current = await store.read(tenantId);
  await store.write(tenantId, {
    ...current,
    sentEmails: [],
    inboxMessages: current.inboxMessages.map((message) => ({
      ...message,
      preview: '',
      unread: false
    })),
    drafts: []
  });
  clearArDataMemo(tenantId);
}
