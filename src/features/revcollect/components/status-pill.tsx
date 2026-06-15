import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CollectionStatus } from '../types';

const statusConfig: Record<CollectionStatus, { label: string; className: string }> = {
  current: {
    label: 'Current',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
  },
  due_soon: {
    label: 'Due soon',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-500/10 text-red-700 dark:text-red-400'
  },
  in_dispute: {
    label: 'In dispute',
    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
  },
  promised: {
    label: 'Promised',
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
  }
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

  return (
    <Badge variant='outline' className={cn('border-0 font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
