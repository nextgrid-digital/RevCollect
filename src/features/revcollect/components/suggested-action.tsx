import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SuggestedActionProps {
  label: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  href?: string;
  className?: string;
  compact?: boolean;
}

export function SuggestedAction({
  label,
  description,
  actionLabel,
  onAction,
  href,
  className,
  compact = false
}: SuggestedActionProps) {
  const actionButton = href ? (
    <Button asChild size={compact ? 'sm' : 'default'} variant={compact ? 'outline' : 'default'}>
      <Link href={href}>{actionLabel}</Link>
    </Button>
  ) : (
    <Button
      type='button'
      size={compact ? 'sm' : 'default'}
      variant={compact ? 'outline' : 'default'}
      onClick={onAction}
    >
      {actionLabel}
    </Button>
  );

  if (compact) {
    return (
      <div className={cn('min-w-0 flex-1', className)}>
        <p className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>
          {label}
        </p>
        <p className='mt-0.5 truncate text-xs font-medium' title={description}>
          {description}
        </p>
        <div className='mt-2'>{actionButton}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-card border-border/60 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</p>
        <p className='text-foreground mt-1 text-sm leading-relaxed'>{description}</p>
      </div>
      <div className='shrink-0'>{actionButton}</div>
    </div>
  );
}
