import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'violet';

const toneClasses: Record<StatusBadgeTone, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-400',
  info: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  neutral: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400'
};

interface StatusBadgeProps {
  label: string;
  tone: StatusBadgeTone;
  className?: string;
  rounded?: 'md' | 'full';
}

export function StatusBadge({ label, tone, className, rounded = 'md' }: StatusBadgeProps) {
  if (rounded === 'full') {
    return (
      <span
        className={cn(
          'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize',
          toneClasses[tone],
          className
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <Badge variant='outline' className={cn('border-0 font-medium', toneClasses[tone], className)}>
      {label}
    </Badge>
  );
}
