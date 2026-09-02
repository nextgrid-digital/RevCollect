import { stripQuotedReply } from '@/lib/email/strip-quoted-reply';
import { getCanonicalStore } from '@/lib/canonical/store';
import { emptyIntelligence } from '@/lib/canonical/defaults';
import type { CustomerIntelligence } from '@/lib/canonical/types';
import type { Customer, RelationshipSuggestion, ThreadEmail } from '@/features/revcollect/types';
import {
  applyPaymentClaimed,
  expireCustomerRelationship,
  policyFromCustomer,
  suggestedPauseDaysForReason,
  withPendingSuggestion
} from '@/features/revcollect/lib/relationship-policy';

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

function latestCustomerReply(emails: ThreadEmail[], customerId: string): ThreadEmail | undefined {
  let latest: ThreadEmail | undefined;
  for (const email of emails) {
    if (email.author !== 'customer' || email.customerId !== customerId) continue;
    if (!latest || email.sentAt > latest.sentAt) latest = email;
  }
  return latest;
}

function quoteFromText(text: string): string {
  const line = text
    .split('\n')
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  return (line ?? text).slice(0, 180);
}

export function detectRelationshipSignal(text: string): RelationshipSuggestion | null {
  const lower = text.toLowerCase();
  const quote = quoteFromText(text);

  if (/passed away|died|funeral|bereavement|condolence|rest in peace|\brip\b/.test(lower)) {
    return {
      state: 'sensitive_event',
      reason: 'bereavement',
      quote,
      suggestedPauseDays: suggestedPauseDaysForReason('bereavement')
    };
  }

  if (/hospital|in surgery|accident|icu|medical emergency/.test(lower)) {
    return {
      state: 'sensitive_event',
      reason: 'medical',
      quote,
      suggestedPauseDays: suggestedPauseDaysForReason('medical')
    };
  }

  if (/family emergency|personal emergency/.test(lower)) {
    return {
      state: 'sensitive_event',
      reason: 'family_emergency',
      quote,
      suggestedPauseDays: suggestedPauseDaysForReason('family_emergency')
    };
  }

  const proposedEmail = text.match(EMAIL_PATTERN)?.[0];
  if (
    /wrong (person|email|contact)|not the (right|correct) (person|contact)|send (this )?to |please contact |undeliverable|mailbox (not found|unavailable)|bounce/.test(
      lower
    )
  ) {
    return {
      state: proposedEmail ? 'normal' : 'do_not_contact',
      reason: 'wrong_contact',
      quote,
      suggestedPauseDays: 0,
      proposedEmail: proposedEmail?.toLowerCase()
    };
  }

  if (
    /we('ve| have)? (already )?paid|payment (has been )?(sent|made)|wire (has been )?sent|remittance|funds (have been )?sent/.test(
      lower
    ) &&
    !/will pay|i['’]ll pay|going to pay/.test(lower)
  ) {
    return {
      state: 'payment_claimed',
      reason: 'payment_claimed',
      quote,
      suggestedPauseDays: 0
    };
  }

  if (
    /not our invoice|we dispute|this is incorrect|do not recognise|do not recognize/.test(lower)
  ) {
    return {
      state: 'active_dispute',
      reason: 'dispute',
      quote,
      suggestedPauseDays: 14
    };
  }

  return null;
}

export function replyLooksLikePaymentClaimed(text: string): boolean {
  return detectRelationshipSignal(text)?.reason === 'payment_claimed';
}

function persistCustomer(
  snapshot: {
    customers: Customer[];
    intelligenceByCustomerId: Record<string, CustomerIntelligence>;
  },
  customer: Customer
): void {
  snapshot.customers = snapshot.customers.map((item) =>
    item.id === customer.id ? customer : item
  );
  const intelligence = snapshot.intelligenceByCustomerId[customer.id] ?? emptyIntelligence();
  const policy = policyFromCustomer(customer);
  snapshot.intelligenceByCustomerId[customer.id] = {
    ...intelligence,
    relationshipState: policy.state,
    relationshipPolicy: policy,
    classifiedReplyId: customer.classifiedReplyId
  };
}

export async function applyRelationshipSignals(tenantId: string): Promise<boolean> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const emails = snapshot.sentEmails ?? [];
  let changed = false;

  for (const current of snapshot.customers) {
    const expired = expireCustomerRelationship(current);
    if (expired.relationshipState !== current.relationshipState) {
      persistCustomer(snapshot, expired);
      changed = true;
    }

    const customer = snapshot.customers.find((item) => item.id === current.id) ?? expired;
    if (customer.balanceCents <= 0) continue;

    const latest = latestCustomerReply(emails, customer.id);
    if (!latest) continue;

    const policy = policyFromCustomer(customer);
    if (policy.pendingSuggestion?.sourceMessageId === latest.id) continue;
    if (policy.sourceMessageId === latest.id) continue;
    if (
      policy.state !== 'normal' &&
      policy.state !== 'resume_review' &&
      policy.state !== 'payment_claimed'
    ) {
      continue;
    }

    const text = stripQuotedReply(latest.body);
    if (!text) continue;
    const detected = detectRelationshipSignal(text);
    if (!detected) continue;

    const suggestion: RelationshipSuggestion = {
      ...detected,
      sourceMessageId: latest.id
    };

    const next =
      suggestion.reason === 'payment_claimed'
        ? applyPaymentClaimed(customer, {
            quote: suggestion.quote,
            sourceMessageId: latest.id
          })
        : withPendingSuggestion(customer, suggestion);

    persistCustomer(snapshot, next);
    changed = true;
  }

  if (!changed) return false;
  await store.write(tenantId, snapshot);
  return true;
}
