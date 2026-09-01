import { getDaysOverdueFromDueDate } from '@/features/revcollect/utils';
import { isOpenCanonicalInvoice } from '@/features/revcollect/lib/invoice-open';
import {
  formatPromisedDateLabel,
  isBrokenPromise
} from '@/features/revcollect/lib/collection-decision';
import type { Customer, Invoice } from '@/features/revcollect/types';
import { DEFAULT_AGENT_CONFIG, defaultWorkspaceAgentConfig } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import { applyAutoPromises } from './apply-auto-promises';
import { queueFollowUpDraft } from './queue-follow-up-draft';
import { recordAriRun } from './record-ari-run';

export interface OvernightAriResult {
  tenantId: string;
  drafted: number;
  skipped: number;
  bullets: string[];
}

export async function runOvernightAri(
  tenantId: string,
  options?: { forceHour?: boolean }
): Promise<OvernightAriResult> {
  await applyAutoPromises(tenantId);
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const config = snapshot.agentConfig ?? defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
  const digestHour = config.behaviors.digestHour;
  const currentHour = new Date().getUTCHours();
  if (!options?.forceHour && currentHour !== digestHour) {
    return { tenantId, drafted: 0, skipped: 0, bullets: [] };
  }

  const { autoDraftFollowUps, promiseTracking } = config.behaviors;
  if (!config.isActive || (!autoDraftFollowUps && !promiseTracking)) {
    const bullets = [
      'ARI is paused — activate the agent and enable auto-draft follow-ups in Agent settings.'
    ];
    await recordAriRun({ tenantId, bullets, digestHour });
    return { tenantId, drafted: 0, skipped: 0, bullets };
  }

  const brokenPromises = promiseTracking
    ? snapshot.customers.filter((customer) => isBrokenPromise(customer))
    : [];
  const overdueCustomers = autoDraftFollowUps
    ? snapshot.customers.filter(
        (customer) =>
          customer.daysOverdue > 0 &&
          customer.balanceCents > 0 &&
          !brokenPromises.some((item) => item.id === customer.id)
      )
    : [];
  const targets = [...brokenPromises, ...overdueCustomers].slice(0, 25);

  let drafted = 0;
  let skipped = 0;
  const bullets: string[] = [];

  for (const customer of targets) {
    const broken = isBrokenPromise(customer);
    const result = await queueFollowUpDraft({
      tenantId,
      customerId: customer.id,
      tone: config.tone,
      followBrokenPromise: broken
    });
    if (result.draft) {
      drafted += 1;
      bullets.push(overnightDraftBullet(customer, snapshot.invoices, broken));
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

  await recordAriRun({ tenantId, bullets, digestHour });
  return { tenantId, drafted, skipped, bullets };
}

function overnightDraftBullet(customer: Customer, invoices: Invoice[], broken: boolean): string {
  if (broken && customer.promisedDate) {
    return `${customer.company} promised ${formatPromisedDateLabel(customer.promisedDate)} and hasn't paid — draft queued for review`;
  }

  const oldest = invoices
    .filter((invoice) => invoice.customerId === customer.id)
    .filter(isOpenCanonicalInvoice)
    .toSorted(
      (left, right) =>
        getDaysOverdueFromDueDate(right.dueDate) - getDaysOverdueFromDueDate(left.dueDate)
    )[0];
  return `${oldest?.number ?? customer.company} (${customer.company}) is ${customer.daysOverdue} days overdue — draft queued for review`;
}
