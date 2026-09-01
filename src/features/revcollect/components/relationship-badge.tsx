import { StatusBadge, type StatusBadgeTone } from './status-badge';
import type { Customer } from '../types';
import {
  expireRelationshipPolicy,
  policyFromCustomer,
  relationshipBadgeLabel
} from '../lib/relationship-policy';

function toneForCustomer(customer: Customer): StatusBadgeTone {
  const policy = expireRelationshipPolicy(policyFromCustomer(customer));
  if (policy.pendingSuggestion) return 'warning';
  switch (policy.state) {
    case 'active_dispute':
    case 'do_not_contact':
      return 'danger';
    case 'payment_claimed':
    case 'resume_review':
    case 'sensitive_event':
    case 'paused_until_date':
      return 'warning';
    case 'manual_only':
    case 'founder_only':
      return 'violet';
    case 'normal':
      return 'neutral';
    default: {
      const _exhaustive: never = policy.state;
      return _exhaustive;
    }
  }
}

export function RelationshipBadge({
  customer,
  className
}: {
  customer: Customer;
  className?: string;
}) {
  const label = relationshipBadgeLabel(customer);
  if (!label) return null;
  return (
    <StatusBadge
      label={label}
      tone={toneForCustomer(customer)}
      rounded='full'
      className={className}
    />
  );
}
