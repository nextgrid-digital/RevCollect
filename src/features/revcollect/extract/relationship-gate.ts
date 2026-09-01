import type { Customer } from '@/features/revcollect/types';
import {
  followUpDecision,
  type FollowUpOptions
} from '@/features/revcollect/lib/relationship-policy';

export function canFollowUp(customer: Customer, options?: FollowUpOptions): boolean {
  return followUpDecision(customer, options).allow;
}

export function canQueuePaymentDemand(customer: Customer): boolean {
  const decision = followUpDecision(customer, { overnight: true });
  return decision.allow && decision.draftKind === 'collection';
}

export function ariSkipReason(customer: Customer, options?: FollowUpOptions): string | null {
  const decision = followUpDecision(customer, {
    ...options,
    overnight: options?.overnight ?? true
  });
  return decision.allow ? null : decision.reason;
}
