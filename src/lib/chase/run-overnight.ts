import { getDaysOverdueFromDueDate } from '@/features/revcollect/utils';
import { isOpenCanonicalInvoice } from '@/features/revcollect/lib/invoice-open';
import { DEFAULT_AGENT_CONFIG, defaultWorkspaceAgentConfig } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import { queueFollowUpDraft } from './queue-follow-up-draft';
import { recordChaseRun } from './record-chase-run';

export interface OvernightChaseResult {
  tenantId: string;
  drafted: number;
  skipped: number;
  bullets: string[];
}

export async function runOvernightChase(
  tenantId: string,
  options?: { forceHour?: boolean }
): Promise<OvernightChaseResult> {
  const store = await getCanonicalStore();
  let snapshot = await store.read(tenantId);
  const config = snapshot.agentConfig ?? defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
  const digestHour = config.behaviors.digestHour;
  const currentHour = new Date().getUTCHours();
  if (!options?.forceHour && config.behaviors.dailyDigest && currentHour !== digestHour) {
    return { tenantId, drafted: 0, skipped: 0, bullets: [] };
  }
  if (!config.behaviors.autoDraftFollowUps || !config.isActive) {
    const bullets = [
      'Chase is paused — activate the agent and enable auto-draft follow-ups in Agent settings.'
    ];
    await recordChaseRun({ tenantId, bullets, digestHour });
    return { tenantId, drafted: 0, skipped: 0, bullets };
  }

  const overdueCustomers = snapshot.customers.filter(
    (customer) => customer.daysOverdue > 0 && customer.balanceCents > 0
  );
  let drafted = 0;
  let skipped = 0;
  const bullets: string[] = [];

  for (const customer of overdueCustomers.slice(0, 25)) {
    const result = await queueFollowUpDraft({
      tenantId,
      customerId: customer.id,
      tone: config.tone
    });
    if (result.draft) {
      drafted += 1;
      const invoices = snapshot.invoices
        .filter((invoice) => invoice.customerId === customer.id)
        .filter(isOpenCanonicalInvoice);
      const oldest = invoices.toSorted(
        (left, right) =>
          getDaysOverdueFromDueDate(right.dueDate) - getDaysOverdueFromDueDate(left.dueDate)
      )[0];
      bullets.push(
        `${oldest?.number ?? customer.company} (${customer.company}) is ${customer.daysOverdue} days overdue — draft queued for review`
      );
    } else {
      skipped += 1;
      if (result.skipped) {
        bullets.push(`${customer.company}: ${result.skipped}`);
      }
    }
  }

  if (drafted === 0 && skipped === 0) {
    bullets.push('No overdue accounts needed a follow-up draft.');
  }

  await recordChaseRun({ tenantId, bullets, digestHour });
  return { tenantId, drafted, skipped, bullets };
}
