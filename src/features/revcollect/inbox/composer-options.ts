import { Icons } from '@/components/icons';
import type { CollectionStatus } from '../types';

export type CollectionTone = 'professional' | 'friendly' | 'firm';

export type CollectionPlaybook =
  | 'standard'
  | 'final_notice'
  | 'payment_verification'
  | 'dispute_hold';

export const COLLECTION_TONES = [
  {
    id: 'professional' as const,
    label: 'Professional',
    icon: Icons.post,
    description: 'Clear, neutral language suitable for most AR correspondence'
  },
  {
    id: 'friendly' as const,
    label: 'Friendly',
    icon: Icons.user,
    description: 'Warmer phrasing while keeping payment expectations explicit'
  },
  {
    id: 'firm' as const,
    label: 'Firm',
    icon: Icons.warning,
    description: 'Direct deadlines and consequences for overdue balances'
  }
];

export const COLLECTION_PLAYBOOKS = [
  {
    id: 'standard' as const,
    name: 'Standard',
    version: 'Reminder & follow-up'
  },
  {
    id: 'payment_verification' as const,
    name: 'Payment check',
    version: 'Thank you + reference'
  }
];

export function defaultPlaybookForStatus(_status: CollectionStatus): CollectionPlaybook {
  return 'standard';
}

export function defaultPlaybookForCustomer(
  _status: CollectionStatus,
  options?: { paymentClaimed?: boolean; allowLegalLanguage?: boolean }
): CollectionPlaybook {
  if (options?.paymentClaimed) return 'payment_verification';
  return 'standard';
}

export function getToneLabel(tone: CollectionTone): string {
  return COLLECTION_TONES.find((t) => t.id === tone)?.label ?? 'Professional';
}

export function getPlaybookLabel(playbook: CollectionPlaybook): string {
  return COLLECTION_PLAYBOOKS.find((p) => p.id === playbook)?.name ?? 'Standard';
}
