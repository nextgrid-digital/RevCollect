import { randomUUID } from 'crypto';
import { complete } from '@/lib/ai/complete';
import { templateFollowUpDraft, templatePaymentVerificationDraft } from '@/lib/ai/template-draft';
import { validateQueuedDraft } from '@/lib/ai/validators';
import { assembleCustomerContext } from '@/features/revcollect/context/assemble-context';
import { ariSkipReason } from '@/features/revcollect/extract/relationship-gate';
import {
  DEFAULT_AGENT_CONFIG,
  defaultWorkspaceAgentConfig,
  emptyIntelligence
} from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { AgentDraftRecord } from '@/lib/canonical/types';
import type { AgentDraftTone } from '@/features/revcollect/types';
import { isOpenCanonicalInvoice } from '@/features/revcollect/lib/invoice-open';
import {
  applyCollectionDecisionToCustomer,
  collectionFollowUpSkipReason,
  isBrokenPromise
} from '@/features/revcollect/lib/collection-decision';
import { followUpDecision } from '@/features/revcollect/lib/relationship-policy';

export async function queueFollowUpDraft(input: {
  tenantId: string;
  customerId: string;
  tone?: AgentDraftTone;
  followBrokenPromise?: boolean;
}): Promise<{ draft: AgentDraftRecord | null; skipped?: string }> {
  const { tenantId, customerId, tone = 'professional', followBrokenPromise = false } = input;
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const customer = snapshot.customers.find((item) => item.id === customerId);
  if (!customer) return { draft: null, skipped: 'customer_not_found' };

  const collectionSkip = collectionFollowUpSkipReason(customer, { followBrokenPromise });
  if (collectionSkip) return { draft: null, skipped: collectionSkip };

  const config = snapshot.agentConfig ?? defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
  const skip = ariSkipReason(customer, {
    overnight: true,
    allowOvernightManualOnly: config.behaviors.overnightDraftManualOnly
  });
  if (skip) return { draft: null, skipped: skip };

  const decision = followUpDecision(customer, {
    overnight: true,
    allowOvernightManualOnly: config.behaviors.overnightDraftManualOnly
  });

  const intelligence = snapshot.intelligenceByCustomerId[customerId] ?? emptyIntelligence();
  const invoices = snapshot.invoices
    .filter((invoice) => invoice.customerId === customerId)
    .filter(isOpenCanonicalInvoice);
  const brokenPromise = followBrokenPromise && isBrokenPromise(customer);
  const assembled = await assembleCustomerContext(tenantId, customerId);
  const template =
    decision.draftKind === 'payment_verification'
      ? templatePaymentVerificationDraft({
          customer,
          invoices,
          greeting: intelligence.preferences.greeting,
          signoff: intelligence.preferences.signoff
        })
      : templateFollowUpDraft({
          customer,
          invoices,
          greeting: intelligence.preferences.greeting,
          signoff: intelligence.preferences.signoff,
          promisedDate: brokenPromise ? customer.promisedDate : undefined
        });

  let body = template;
  const generated = await complete({
    taskType: 'generate',
    prompt: [
      assembled?.promptBlock ?? '',
      '',
      decision.draftKind === 'payment_verification'
        ? `They said payment was already sent. Write a short ${tone} thank-you that asks for a payment reference. Do not say the invoice is overdue or chase payment.`
        : brokenPromise && customer.promisedDate
          ? `They promised to pay by ${customer.promisedDate} and have not. Write a short ${tone} follow-up.`
          : `Write a short ${tone} collections follow-up email.`,
      'Do not invent invoice numbers, amounts, dates, or names.',
      'Do not claim the email was sent. This is a draft for human approval.',
      'Do not mention legal action, penalties, late fees, or that they are avoiding payment.'
    ].join('\n')
  });
  if (generated.source === 'model' && generated.text) {
    const validation = validateQueuedDraft(
      generated.text,
      assembled?.facts ?? { invoiceNumbers: [], amounts: [], dates: [] },
      {
        allowLegalLanguage: config.behaviors.allowLegalLanguage,
        allowLateFeeMentions: config.behaviors.allowLateFeeMentions
      }
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
    title:
      decision.draftKind === 'payment_verification'
        ? `Payment to reconcile · ${customer.company}`
        : brokenPromise
          ? `Promise missed · ${customer.company}`
          : `Follow-up · ${customer.company}`,
    body,
    tone,
    preparedAt: new Date().toISOString()
  };

  snapshot.drafts = [...snapshot.drafts.filter((item) => item.customerId !== customerId), draft];
  snapshot.inboxMessages = snapshot.inboxMessages.map((message) =>
    message.customerId === customerId ? { ...message, agentDraftReady: true } : message
  );
  if (brokenPromise) {
    const released = applyCollectionDecisionToCustomer(customer, {
      customerId,
      action: 'chase_again'
    });
    snapshot.customers = snapshot.customers.map((item) =>
      item.id === released.id ? released : item
    );
  }
  await store.write(tenantId, snapshot);
  return { draft };
}
