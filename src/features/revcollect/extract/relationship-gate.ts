import type { RelationshipState } from '@/features/revcollect/types';

export function canQueuePaymentDemand(relationshipState: RelationshipState | undefined): boolean {
  return (relationshipState ?? 'normal') === 'normal';
}

export function chaseSkipReason(relationshipState: RelationshipState | undefined): string | null {
  switch (relationshipState ?? 'normal') {
    case 'normal':
      return null;
    case 'sensitive':
      return 'relationship_state is sensitive — no payment-demand drafts';
    case 'paused':
      return 'relationship_state is paused — chase skipped';
    default: {
      const _exhaustive: never = relationshipState as never;
      return `unknown relationship_state: ${String(_exhaustive)}`;
    }
  }
}
