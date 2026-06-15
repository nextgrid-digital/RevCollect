import type { CollectionStatus } from '../types';
import { StatusBadge, type StatusBadgeTone } from './status-badge';

const statusConfig: Record<CollectionStatus, { label: string; tone: StatusBadgeTone }> = {
  current: { label: 'Current', tone: 'success' },
  due_soon: { label: 'Due soon', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  in_dispute: { label: 'In dispute', tone: 'info' },
  promised: { label: 'Promised', tone: 'neutral' }
};

export const collectionStatusOptions = (
  Object.entries(statusConfig) as [CollectionStatus, (typeof statusConfig)[CollectionStatus]][]
).map(([value, { label }]) => ({ value, label }));

interface StatusPillProps {
  status: CollectionStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status];
  return <StatusBadge label={config.label} tone={config.tone} className={className} />;
}
