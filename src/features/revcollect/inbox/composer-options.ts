import { Icons } from '@/components/icons';
import type { CollectionStatus } from '../types';

export type CollectionTone = 'professional' | 'friendly' | 'firm';

export type CollectionPlaybook = 'standard' | 'dispute' | 'final_notice';

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
    id: 'dispute' as const,
    name: 'Dispute',
    version: 'Resolution'
  },
  {
    id: 'final_notice' as const,
    name: 'Final notice',
    version: 'Escalation'
  }
];

export function defaultPlaybookForStatus(status: CollectionStatus): CollectionPlaybook {
  if (status === 'in_dispute') return 'dispute';
  if (status === 'overdue') return 'final_notice';
  return 'standard';
}

export function getToneLabel(tone: CollectionTone): string {
  return COLLECTION_TONES.find((t) => t.id === tone)?.label ?? 'Professional';
}

export function getPlaybookLabel(playbook: CollectionPlaybook): string {
  return COLLECTION_PLAYBOOKS.find((p) => p.id === playbook)?.name ?? 'Standard';
}
