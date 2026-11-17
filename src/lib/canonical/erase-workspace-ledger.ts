import { emptySnapshot } from './defaults';
import { clearArDataMemo } from './ar-data-memo';
import { getCanonicalStore } from './store';
import {
  disconnectGmail,
  disconnectQuickBooks,
  disconnectXero,
  disconnectZoho
} from '@/lib/integrations/disconnect-integration';

/** Revoke ledger and Gmail tokens and delete the stored books snapshot. Billing stays. */
export async function eraseWorkspaceLedger(tenantId: string): Promise<void> {
  await Promise.all([
    disconnectQuickBooks(tenantId),
    disconnectXero(tenantId),
    disconnectZoho(tenantId),
    disconnectGmail(tenantId)
  ]);

  const store = await getCanonicalStore();
  const current = await store.read(tenantId);
  await store.write(
    tenantId,
    {
      ...emptySnapshot(),
      workspaceSettings: current.workspaceSettings,
      agentConfig: current.agentConfig,
      agentAddonStatus: current.agentAddonStatus,
      stripeCustomerId: current.stripeCustomerId,
      stripeSubscriptionId: current.stripeSubscriptionId,
      trialStartedAt: current.trialStartedAt,
      baseSubscribed: current.baseSubscribed
    },
    { purgeEmpty: true }
  );
  clearArDataMemo(tenantId);
}
