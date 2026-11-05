import { randomUUID } from 'crypto';
import { templateFollowUpDraft, templatePaymentVerificationDraft } from '@/lib/ai/template-draft';
import { validateQueuedDraft } from '@/lib/ai/validators';
import { assembleCustomerContext } from '@/features/revcollect/context/assemble-context';
import { ariSkipReason } from '@/features/revcollect/extract/relationship-gate';
import {
  DEFAULT_AGENT_CONFIG,
  defaultWorkspaceAgentConfig,
  emptyIntelligence
} from '@/lib/canonical/defaults';
import { latestUnansweredCustomerReply } from '@/lib/canonical/sent-emails';
import { stripQuotedReply } from '@/lib/email/strip-quoted-reply';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { AgentDraftRecord, CanonicalSnapshot } from '@/lib/canonical/types';
import type { CanonicalStore } from '@/lib/canonical/types';
import type { AgentDraftTone } from '@/features/revcollect/types';
import { isOpenCanonicalInvoice } from '@/features/revcollect/lib/invoice-open';
import {
  applyCollectionDecisionToCustomer,
  collectionFollowUpSkipReason,
  isBrokenPromise
} from '@/features/revcollect/lib/collection-decision';
import {
  followUpDecision,
  isPaymentClaimStale,
  policyFromCustomer
} from '@/features/revcollect/lib/relationship-policy';
import { scoreKeptDraft } from '@/lib/ari/draft-eval';
import { pushDecisionTrace } from '@/lib/ari/decision-trace';
import type { DecisionTrace } from '@/lib/ari/decision-trace-types';
import { explainDecision } from '@/lib/ari/explain-decision';
import { generateDraftText } from '@/lib/ari/generate-draft-text';
import { callUsage, estimateTokens, type ModelCallUsage } from '@/lib/ai/model-usage';

function draftFailureLabel(error: unknown): string {
  if (!(error instanceof Error)) return 'request failed';
  const gemini = error.message.match(/^Gemini request failed \((\d+)\)$/);
  if (gemini) return `status ${gemini[1]}`;
  if (error.message === 'Gemini returned an empty draft') return 'empty draft';
  return error.name;
}

const DRAFT_SYSTEM = [
  'You write collection email drafts for human approval.',
  'Use ONLY the facts provided. Do not invent invoice numbers, amounts, dates, or names.',
  'Do not claim the email was sent.',
  'Do not mention legal action, penalties, late fees, or that the customer is avoiding payment.',
  'Return only the email body.'
].join(' ');

export async function queueFollowUpDraft(input: {
  tenantId: string;
  customerId: string;
  tone?: AgentDraftTone;
  followBrokenPromise?: boolean;
  explain?: boolean;
}): Promise<{ draft: AgentDraftRecord | null; skipped?: string; trace: DecisionTrace | null }> {
  const {
    tenantId,
    customerId,
    tone: toneInput,
    followBrokenPromise = false,
    explain = false
  } = input;
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const customer = snapshot.customers.find((item) => item.id === customerId);
  if (!customer) return { draft: null, skipped: 'customer_not_found', trace: null };
  const current = customer;

  const config = snapshot.agentConfig ?? defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
  const tone = toneInput ?? config.tone ?? 'professional';
  const language = {
    allowLegalLanguage: config.behaviors.allowLegalLanguage,
    allowLateFeeMentions: config.behaviors.allowLateFeeMentions
  };

  async function recordSkip(reason: string): Promise<DecisionTrace | null> {
    if (!explain) return null;
    const assembled = await assembleCustomerContext(tenantId, customerId);
    const trace = await explainDecision({
      customerId,
      company: current.company,
      source: 'playground',
      factPack: assembled?.promptBlock ?? '',
      facts: assembled?.facts ?? { invoiceNumbers: [], amounts: [], dates: [] },
      draftBody: null,
      draftSource: 'none',
      draftModel: null,
      codeAction: reason === 'do_not_contact' ? 'do_not_contact' : 'skip',
      gate: reason,
      language
    });
    pushDecisionTrace(snapshot, trace);
    await store.write(tenantId, snapshot);
    return trace;
  }

  const collectionSkip = collectionFollowUpSkipReason(customer, { followBrokenPromise });
  if (collectionSkip) {
    return { draft: null, skipped: collectionSkip, trace: await recordSkip(collectionSkip) };
  }

  const skip = ariSkipReason(customer, {
    overnight: true,
    allowOvernightManualOnly: config.behaviors.overnightDraftManualOnly
  });
  if (skip) {
    return { draft: null, skipped: skip, trace: await recordSkip(skip) };
  }

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
  const staleClaim = isPaymentClaimStale(policyFromCustomer(customer));
  const customerReply = latestUnansweredCustomerReply(snapshot.sentEmails ?? [], customerId);
  const replyText = customerReply ? stripQuotedReply(customerReply.body).trim().slice(0, 1500) : '';
  const template =
    decision.draftKind === 'payment_verification'
      ? templatePaymentVerificationDraft({
          customer,
          invoices,
          greeting: intelligence.preferences.greeting,
          signoff: intelligence.preferences.signoff,
          unmatched: staleClaim
        })
      : templateFollowUpDraft({
          customer,
          invoices,
          greeting: intelligence.preferences.greeting,
          signoff: intelligence.preferences.signoff,
          promisedDate: brokenPromise ? customer.promisedDate : undefined
        });

  const replyInstruction = replyText
    ? `They wrote:\n"""\n${replyText}\n"""\nReply to that message. Do not send a reminder that ignores what they said.`
    : '';
  const task = [
    decision.draftKind === 'payment_verification'
      ? staleClaim
        ? `They said payment was sent, but the balance is still open. Write a short ${tone} note asking for a remittance or payment reference. Do not say the invoice is overdue or use chase language.`
        : `They said payment was already sent. Write a short ${tone} thank-you that asks for a payment reference. Do not say the invoice is overdue or chase payment.`
      : brokenPromise && customer.promisedDate
        ? `They promised to pay by ${customer.promisedDate} and have not. Write a short ${tone} follow-up.`
        : replyText
          ? `Write a short ${tone} reply to their message. Use the open invoices only to answer them.`
          : `Write a short ${tone} collections follow-up email.`,
    replyInstruction
  ]
    .filter(Boolean)
    .join('\n\n');

  let body = template;
  let draftSource: DecisionTrace['draftSource'] = 'template';
  let draftModel: string | null = null;
  let writerUsage: ModelCallUsage | null = null;
  const draftPrompt = [
    assembled?.promptBlock ?? '',
    config.draftInstruction?.trim()
      ? `Workspace instruction: ${config.draftInstruction.trim()}`
      : '',
    task,
    'Do not invent invoice numbers, amounts, dates, or names.',
    'Do not claim the email was sent. This is a draft for human approval.',
    'Do not mention legal action, penalties, late fees, or that they are avoiding payment.'
  ]
    .filter(Boolean)
    .join('\n');
  try {
    const generated = await generateDraftText({
      system: DRAFT_SYSTEM,
      temperature: 0.3,
      prompt: draftPrompt
    });
    writerUsage = callUsage({
      model: generated.modelId,
      inputTokens: generated.inputTokens ?? estimateTokens(`${DRAFT_SYSTEM}\n${draftPrompt}`),
      outputTokens: generated.outputTokens ?? estimateTokens(generated.text),
      counted: generated.inputTokens == null ? 'estimate' : 'provider'
    });
    const validation = validateQueuedDraft(
      generated.text,
      assembled?.facts ?? { invoiceNumbers: [], amounts: [], dates: [] },
      language
    );
    if (validation.ok) {
      body = generated.text;
      draftSource = generated.source;
      draftModel = generated.modelId;
    }
  } catch (error) {
    console.error('[queueFollowUpDraft] draft model failed', draftFailureLabel(error));
  }

  const threadId = `xero-customer-${customerId}`;
  const draft: AgentDraftRecord = {
    id: randomUUID(),
    threadId,
    customerId,
    title:
      decision.draftKind === 'payment_verification'
        ? staleClaim
          ? `Still unpaid — verify · ${customer.company}`
          : `Payment to reconcile · ${customer.company}`
        : brokenPromise
          ? `Promise missed · ${customer.company}`
          : replyText
            ? `Reply · ${customer.company}`
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

  const codeAction =
    decision.draftKind === 'payment_verification'
      ? 'draft_payment_verification'
      : brokenPromise
        ? 'draft_promise_check'
        : replyText
          ? 'draft_reply'
          : 'draft_follow_up';
  const facts = assembled?.facts ?? { invoiceNumbers: [], amounts: [], dates: [] };
  const evals = scoreKeptDraft({
    body,
    draftSource,
    facts,
    language,
    replied: Boolean(replyText)
  });
  const trace = explain
    ? {
        ...(await explainDecision({
          customerId,
          company: customer.company,
          source: 'playground',
          factPack: assembled?.promptBlock ?? '',
          facts,
          draftBody: body,
          draftSource,
          draftModel,
          codeAction,
          gate: null,
          language,
          writerUsage
        })),
        evals
      }
    : {
        id: randomUUID(),
        customerId,
        company: customer.company,
        createdAt: new Date().toISOString(),
        source: 'overnight' as const,
        factPack: assembled?.promptBlock ?? '',
        brief: null,
        briefModel: null,
        draftBody: body,
        draftModel,
        draftSource,
        codeAction,
        jevAction: null,
        jevModel: null,
        scores: [],
        gate: null,
        note: null,
        usage: { writer: writerUsage, jev: null },
        evals
      };
  pushDecisionTrace(snapshot, trace);
  await store.write(tenantId, snapshot);
  return { draft, trace };
}

export async function saveDecisionNote(
  store: CanonicalStore,
  tenantId: string,
  snapshot: CanonicalSnapshot,
  traceId: string,
  note: string
): Promise<DecisionTrace | null> {
  const traces = snapshot.decisionTraces ?? [];
  const index = traces.findIndex((item) => item.id === traceId);
  if (index < 0) return null;
  const next = { ...traces[index], note: note.trim() || null };
  snapshot.decisionTraces = traces.map((item, itemIndex) => (itemIndex === index ? next : item));
  await store.write(tenantId, snapshot);
  return next;
}
