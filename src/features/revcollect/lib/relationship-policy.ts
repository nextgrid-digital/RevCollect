import type {
  Customer,
  RelationshipPauseMode,
  RelationshipPolicy,
  RelationshipReason,
  RelationshipScope,
  RelationshipState,
  RelationshipSuggestion
} from '../types';
import { addDaysIsoDate, todayIsoDate } from './collection-decision';

export type FollowUpDraftKind = 'collection' | 'payment_verification';

export interface FollowUpOptions {
  overnight?: boolean;
  invoiceId?: string;
  toEmail?: string;
  allowOvernightManualOnly?: boolean;
}

export interface FollowUpDecision {
  allow: boolean;
  reason: string | null;
  draftKind: FollowUpDraftKind;
}

export type RelationshipPolicyAction =
  | 'pause'
  | 'resume'
  | 'extend'
  | 'keep_paused'
  | 'dismiss_suggestion'
  | 'confirm_suggestion'
  | 'set_mode'
  | 'update_contact';

export interface RelationshipPolicyInput {
  customerId: string;
  action: RelationshipPolicyAction;
  reason?: RelationshipReason;
  scope?: RelationshipScope;
  invoiceId?: string;
  contactEmail?: string;
  pauseDays?: number;
  pauseUntil?: string;
  pauseMode?: RelationshipPauseMode;
  preferredEmail?: string;
}

const LEGACY_STATE: Record<string, RelationshipState> = {
  sensitive: 'sensitive_event',
  paused: 'paused_until_date'
};

export function emptyRelationshipPolicy(): RelationshipPolicy {
  return {
    state: 'normal',
    scope: 'customer',
    doNotContact: []
  };
}

export function normalizeRelationshipState(value: string | undefined): RelationshipState {
  if (!value) return 'normal';
  if (value in LEGACY_STATE) return LEGACY_STATE[value];
  switch (value) {
    case 'normal':
    case 'sensitive_event':
    case 'active_dispute':
    case 'payment_claimed':
    case 'paused_until_date':
    case 'manual_only':
    case 'founder_only':
    case 'do_not_contact':
    case 'resume_review':
      return value;
    default:
      return 'normal';
  }
}

export function policyFromCustomer(customer: Customer): RelationshipPolicy {
  const policy = customer.relationshipPolicy;
  if (policy) {
    return {
      ...emptyRelationshipPolicy(),
      ...policy,
      state: normalizeRelationshipState(policy.state),
      doNotContact: policy.doNotContact ?? []
    };
  }
  return {
    ...emptyRelationshipPolicy(),
    state: normalizeRelationshipState(customer.relationshipState)
  };
}

export function syncPolicyOntoCustomer(customer: Customer, policy: RelationshipPolicy): Customer {
  return {
    ...customer,
    relationshipPolicy: policy,
    relationshipState: policy.state,
    email: policy.preferredEmail?.trim() || customer.email
  };
}

export const PAYMENT_CLAIM_VERIFY_DAYS = 7;

export function expireRelationshipPolicy(
  policy: RelationshipPolicy,
  now = new Date()
): RelationshipPolicy {
  if (policy.state === 'payment_claimed' && !policy.pauseUntil) {
    return { ...policy, pauseUntil: addDaysIsoDate(-1, now) };
  }
  if (policy.state !== 'paused_until_date' || !policy.pauseUntil) return policy;
  if (policy.pauseUntil >= todayIsoDate(now)) return policy;
  return { ...policy, state: 'resume_review' };
}

export function isPaymentClaimStale(policy: RelationshipPolicy, now = new Date()): boolean {
  if (policy.state !== 'payment_claimed') return false;
  const until = policy.pauseUntil ?? addDaysIsoDate(-1, now);
  return until < todayIsoDate(now);
}

export function applyPaymentClaimed(
  customer: Customer,
  input?: { quote?: string; sourceMessageId?: string },
  now = new Date()
): Customer {
  const current = policyFromCustomer(customer);
  return syncPolicyOntoCustomer(customer, {
    ...current,
    state: 'payment_claimed',
    reason: 'payment_claimed',
    pauseUntil: addDaysIsoDate(PAYMENT_CLAIM_VERIFY_DAYS, now),
    sourceQuote: input?.quote ?? current.sourceQuote,
    sourceMessageId: input?.sourceMessageId ?? current.sourceMessageId,
    pendingSuggestion: undefined
  });
}

export function reconcilePaymentClaimedCustomer(
  customer: Customer,
  options?: { receivedPayment?: boolean }
): Customer {
  const policy = policyFromCustomer(customer);
  if (policy.state !== 'payment_claimed') return customer;
  if (customer.balanceCents > 0 && !options?.receivedPayment) return customer;
  return syncPolicyOntoCustomer(customer, {
    ...emptyRelationshipPolicy(),
    doNotContact: policy.doNotContact,
    preferredEmail: policy.preferredEmail
  });
}

export function expireCustomerRelationship(customer: Customer, now = new Date()): Customer {
  const policy = expireRelationshipPolicy(policyFromCustomer(customer), now);
  return syncPolicyOntoCustomer(customer, policy);
}

export function restoreRelationshipPolicies(
  customers: Customer[],
  previous: Customer[]
): Customer[] {
  const previousById = new Map(previous.map((customer) => [customer.id, customer]));
  return customers.map((customer) => {
    const prev = previousById.get(customer.id);
    if (!prev) return expireCustomerRelationship(customer);
    const prevPolicy = policyFromCustomer(prev);
    if (prevPolicy.state === 'normal' && !prevPolicy.pendingSuggestion) {
      return expireCustomerRelationship(customer);
    }
    return expireCustomerRelationship(
      syncPolicyOntoCustomer(customer, {
        ...prevPolicy,
        preferredEmail: prevPolicy.preferredEmail ?? prev.email
      })
    );
  });
}

export function followUpDecision(customer: Customer, options?: FollowUpOptions): FollowUpDecision {
  const policy = expireRelationshipPolicy(policyFromCustomer(customer));
  const overnight = options?.overnight === true;
  const toEmail = (options?.toEmail ?? customer.email).trim().toLowerCase();
  const dnc = new Set(policy.doNotContact.map((email) => email.trim().toLowerCase()));

  if (policy.state === 'do_not_contact' || (toEmail && dnc.has(toEmail))) {
    return { allow: false, reason: 'do_not_contact', draftKind: 'collection' };
  }

  if (policy.scope === 'invoice' && policy.invoiceId && options?.invoiceId) {
    if (options.invoiceId !== policy.invoiceId) {
      return { allow: true, reason: null, draftKind: 'collection' };
    }
  }

  if (policy.state === 'active_dispute' || customer.status === 'in_dispute') {
    return { allow: false, reason: 'active_dispute', draftKind: 'collection' };
  }

  if (policy.pendingSuggestion?.state === 'sensitive_event') {
    return { allow: false, reason: 'sensitive_suggestion', draftKind: 'collection' };
  }

  if (policy.state === 'sensitive_event') {
    return { allow: false, reason: 'sensitive_event', draftKind: 'collection' };
  }

  if (policy.state === 'payment_claimed') {
    const stale = isPaymentClaimStale(policy);
    return {
      allow: !overnight || stale,
      reason: overnight && !stale ? 'payment_claimed' : null,
      draftKind: 'payment_verification'
    };
  }

  if (policy.state === 'paused_until_date') {
    return { allow: false, reason: 'paused', draftKind: 'collection' };
  }

  if (policy.state === 'resume_review') {
    return { allow: false, reason: 'resume_review', draftKind: 'collection' };
  }

  if (overnight && policy.state === 'founder_only') {
    return { allow: false, reason: 'founder_only', draftKind: 'collection' };
  }

  if (overnight && policy.state === 'manual_only' && !options?.allowOvernightManualOnly) {
    return { allow: false, reason: 'manual_only', draftKind: 'collection' };
  }

  if (policy.state === 'manual_only' || policy.state === 'founder_only') {
    return { allow: true, reason: null, draftKind: 'collection' };
  }

  return { allow: true, reason: null, draftKind: 'collection' };
}

export function ariSkipReasonForCustomer(customer: Customer): string | null {
  const decision = followUpDecision(customer, { overnight: true });
  return decision.allow ? null : decision.reason;
}

export function applyRelationshipPolicyInput(
  customer: Customer,
  input: RelationshipPolicyInput,
  now = new Date()
): Customer {
  const current = expireRelationshipPolicy(policyFromCustomer(customer), now);

  switch (input.action) {
    case 'pause': {
      const pauseMode = input.pauseMode ?? 'no_follow_ups';
      const pauseUntil =
        input.pauseUntil?.slice(0, 10) ??
        (input.pauseDays != null ? addDaysIsoDate(input.pauseDays, now) : undefined);
      const state: RelationshipState =
        pauseMode === 'manual_only'
          ? 'manual_only'
          : pauseMode === 'founder_only'
            ? 'founder_only'
            : 'paused_until_date';
      return syncPolicyOntoCustomer(customer, {
        ...current,
        state,
        reason: input.reason ?? 'manual',
        scope: input.scope ?? 'customer',
        invoiceId: input.invoiceId,
        contactEmail: input.contactEmail,
        pauseUntil,
        pauseMode,
        pendingSuggestion: undefined
      });
    }
    case 'resume':
      return syncPolicyOntoCustomer(customer, {
        ...emptyRelationshipPolicy(),
        doNotContact: current.doNotContact,
        preferredEmail: current.preferredEmail
      });
    case 'extend': {
      const pauseUntil =
        input.pauseUntil?.slice(0, 10) ?? addDaysIsoDate(input.pauseDays ?? 14, now);
      if (current.state === 'payment_claimed') {
        return syncPolicyOntoCustomer(customer, {
          ...current,
          pauseUntil,
          pendingSuggestion: undefined
        });
      }
      return syncPolicyOntoCustomer(customer, {
        ...current,
        state: 'paused_until_date',
        pauseUntil,
        pendingSuggestion: undefined
      });
    }
    case 'keep_paused':
      return syncPolicyOntoCustomer(customer, {
        ...current,
        state: 'paused_until_date',
        pauseUntil: undefined,
        pendingSuggestion: undefined
      });
    case 'dismiss_suggestion':
      return syncPolicyOntoCustomer(customer, {
        ...current,
        pendingSuggestion: undefined
      });
    case 'confirm_suggestion': {
      const suggestion = current.pendingSuggestion;
      if (!suggestion) return customer;
      if (suggestion.state === 'payment_claimed') {
        return applyPaymentClaimed(
          customer,
          {
            quote: suggestion.quote,
            sourceMessageId: suggestion.sourceMessageId
          },
          now
        );
      }
      if (suggestion.state === 'active_dispute') {
        return syncPolicyOntoCustomer(
          { ...customer, status: 'in_dispute', promisedDate: undefined },
          {
            ...current,
            state: 'active_dispute',
            reason: 'dispute',
            sourceQuote: suggestion.quote,
            sourceMessageId: suggestion.sourceMessageId,
            pendingSuggestion: undefined
          }
        );
      }
      if (suggestion.state === 'do_not_contact' || suggestion.reason === 'wrong_contact') {
        const nextEmail = suggestion.proposedEmail?.trim();
        const previousEmail = customer.email.trim().toLowerCase();
        const doNotContact = [...current.doNotContact];
        if (previousEmail && !doNotContact.includes(previousEmail)) {
          doNotContact.push(previousEmail);
        }
        return syncPolicyOntoCustomer(customer, {
          ...current,
          state: nextEmail ? 'normal' : 'do_not_contact',
          reason: 'wrong_contact',
          preferredEmail: nextEmail || current.preferredEmail,
          doNotContact,
          sourceQuote: suggestion.quote,
          sourceMessageId: suggestion.sourceMessageId,
          pendingSuggestion: undefined
        });
      }
      return applyRelationshipPolicyInput(
        customer,
        {
          customerId: customer.id,
          action: 'pause',
          reason: suggestion.reason,
          pauseDays: suggestion.suggestedPauseDays,
          pauseMode: 'no_follow_ups'
        },
        now
      );
    }
    case 'set_mode': {
      const pauseMode = input.pauseMode ?? 'manual_only';
      const state: RelationshipState =
        pauseMode === 'founder_only'
          ? 'founder_only'
          : pauseMode === 'no_follow_ups'
            ? 'do_not_contact'
            : 'manual_only';
      return syncPolicyOntoCustomer(customer, {
        ...current,
        state,
        reason: input.reason ?? 'vip_customer',
        pauseMode,
        pendingSuggestion: undefined
      });
    }
    case 'update_contact': {
      const nextEmail = input.preferredEmail?.trim();
      if (!nextEmail) return customer;
      const previousEmail = customer.email.trim().toLowerCase();
      const doNotContact = [...current.doNotContact];
      if (
        previousEmail &&
        previousEmail !== nextEmail.toLowerCase() &&
        !doNotContact.includes(previousEmail)
      ) {
        doNotContact.push(previousEmail);
      }
      return syncPolicyOntoCustomer(customer, {
        ...current,
        preferredEmail: nextEmail,
        doNotContact,
        pendingSuggestion: undefined,
        state: current.state === 'do_not_contact' ? 'normal' : current.state,
        reason: 'wrong_contact'
      });
    }
    default: {
      const _exhaustive: never = input.action;
      return _exhaustive;
    }
  }
}

export function withPendingSuggestion(
  customer: Customer,
  suggestion: RelationshipSuggestion
): Customer {
  const current = policyFromCustomer(customer);
  return syncPolicyOntoCustomer(customer, {
    ...current,
    pendingSuggestion: suggestion
  });
}

export function relationshipBadgeLabel(customer: Customer): string | null {
  const policy = expireRelationshipPolicy(policyFromCustomer(customer));
  if (policy.pendingSuggestion) {
    return pendingSuggestionLabel(policy.pendingSuggestion);
  }
  switch (policy.state) {
    case 'normal':
      return null;
    case 'sensitive_event':
      return policy.reason === 'bereavement' ? 'Paused: Bereavement' : 'Sensitive event';
    case 'active_dispute':
      return 'Blocked: dispute';
    case 'payment_claimed':
      return isPaymentClaimStale(policy) ? 'Still unpaid — verify' : 'Payment to reconcile';
    case 'paused_until_date':
      return pauseReasonLabel(policy.reason);
    case 'manual_only':
      return 'Manual only';
    case 'founder_only':
      return 'Founder review';
    case 'do_not_contact':
      return 'Do not contact';
    case 'resume_review':
      return 'Resume review';
    default: {
      const _exhaustive: never = policy.state;
      return _exhaustive;
    }
  }
}

export function pendingSuggestionLabel(suggestion: RelationshipSuggestion): string {
  switch (suggestion.reason) {
    case 'bereavement':
      return 'Suggest pause: bereavement';
    case 'medical':
      return 'Suggest pause: medical';
    case 'family_emergency':
      return 'Suggest pause: family emergency';
    case 'payment_claimed':
      return 'Payment claimed';
    case 'wrong_contact':
      return 'Wrong contact';
    case 'dispute':
      return 'Suggest dispute';
    case 'cash_flow':
      return 'Suggest softer follow-up';
    case 'vip_customer':
      return 'Founder review suggested';
    case 'manual':
      return 'Review needed';
    default: {
      const _exhaustive: never = suggestion.reason;
      return _exhaustive;
    }
  }
}

function pauseReasonLabel(reason: RelationshipReason | undefined): string {
  switch (reason) {
    case 'bereavement':
      return 'Paused: Bereavement';
    case 'medical':
      return 'Paused: Medical';
    case 'family_emergency':
      return 'Paused: Family emergency';
    case 'cash_flow':
      return 'Paused: Cash flow';
    case 'dispute':
      return 'Paused: Dispute';
    case 'payment_claimed':
      return 'Paused: Payment claimed';
    case 'wrong_contact':
      return 'Paused: Wrong contact';
    case 'vip_customer':
      return 'Paused: VIP';
    case 'manual':
    case undefined:
      return 'Paused';
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

export function suggestedPauseDaysForReason(reason: RelationshipReason): number {
  switch (reason) {
    case 'bereavement':
      return 14;
    case 'medical':
      return 14;
    case 'family_emergency':
      return 10;
    case 'cash_flow':
      return 7;
    case 'dispute':
    case 'payment_claimed':
    case 'wrong_contact':
    case 'vip_customer':
    case 'manual':
      return 14;
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}
