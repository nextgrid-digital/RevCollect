import { randomUUID } from 'crypto';
import { complete } from '@/lib/ai/complete';
import { templateFollowUpDraft } from '@/lib/ai/template-draft';
import { validateDraftAgainstFacts } from '@/lib/ai/validators';
import { assembleCustomerContext } from '@/features/revcollect/context/assemble-context';
import { chaseSkipReason } from '@/features/revcollect/extract/relationship-gate';
import { emptyIntelligence } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { AgentDraftRecord } from '@/lib/canonical/types';
import type { AgentDraftTone } from '@/features/revcollect/types';
import { isOpenCanonicalInvoice } from '@/features/revcollect/lib/invoice-open';

export async function queueFollowUpDraft(input: {
  tenantId: string;
  customerId: string;
  tone?: AgentDraftTone;
}): Promise<{ draft: AgentDraftRecord | null; skipped?: string }> {
  const { tenantId, customerId, tone = 'professional' } = input;
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const customer = snapshot.customers.find((item) => item.id === customerId);
  if (!customer) return { draft: null, skipped: 'customer_not_found' };

  const intelligence = snapshot.intelligenceByCustomerId[customerId] ?? emptyIntelligence();
  const skip = chaseSkipReason(intelligence.relationshipState);
  if (skip) return { draft: null, skipped: skip };

  const invoices = snapshot.invoices
    .filter((invoice) => invoice.customerId === customerId)
    .filter(isOpenCanonicalInvoice);
  const assembled = await assembleCustomerContext(tenantId, customerId);
  const template = templateFollowUpDraft({
    customer,
    invoices,
    greeting: intelligence.preferences.greeting,
    signoff: intelligence.preferences.signoff
  });

  let body = template;
  const generated = await complete({
    taskType: 'generate',
    prompt: [
      assembled?.promptBlock ?? '',
      '',
      `Write a short ${tone} collections follow-up email.`,
      'Do not invent invoice numbers, amounts, dates, or names.',
      'Do not claim the email was sent. This is a draft for human approval.'
    ].join('\n')
  });
  if (generated.source === 'model' && generated.text) {
    const validation = validateDraftAgainstFacts(
      generated.text,
      assembled?.facts ?? { invoiceNumbers: [], amounts: [], dates: [] }
    );
    if (validation.ok) {
      body = generated.text;
    }
  }

  const threadId = `xero-customer-${customerId}`;
  const draft: AgentDraftRecord = {
    id: randomUUID(),
    threadId,
    customerId,
    title: `Follow-up · ${customer.company}`,
    body,
    tone,
    preparedAt: new Date().toISOString()
  };

  snapshot.drafts = [...snapshot.drafts.filter((item) => item.customerId !== customerId), draft];
  snapshot.inboxMessages = snapshot.inboxMessages.map((message) =>
    message.customerId === customerId ? { ...message, agentDraftReady: true } : message
  );
  await store.write(tenantId, snapshot);
  return { draft };
}
