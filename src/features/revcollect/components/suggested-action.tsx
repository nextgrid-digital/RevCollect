import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SuggestedActionOption {
  label: string;
  onAction?: () => void;
  href?: string;
  icon?: ReactNode;
}

interface SuggestedActionProps {
  label: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  actions?: SuggestedActionOption[];
  className?: string;
  compact?: boolean;
}

function SuggestedActionButton({
  action,
  compact
}: {
  action: SuggestedActionOption;
  compact: boolean;
}) {
  const content = (
    <>
      {action.icon}
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Button
        asChild
        size={compact ? 'sm' : 'default'}
        variant={compact ? 'outline' : 'default'}
        className={cn(compact && 'h-7 gap-1.5 px-2.5 text-xs')}
      >
        <Link href={action.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      type='button'
      size={compact ? 'sm' : 'default'}
      variant={compact ? 'outline' : 'default'}
      className={cn(compact && 'h-7 gap-1.5 px-2.5 text-xs')}
      onClick={action.onAction}
    >
      {content}
    </Button>
  );
}

export function SuggestedAction({
  label,
  description,
  actionLabel,
  onAction,
  href,
  actions,
  className,
  compact = false
}: SuggestedActionProps) {
  const resolvedActions = actions ?? (actionLabel ? [{ label: actionLabel, onAction, href }] : []);

  const actionButtons =
    resolvedActions.length > 1 ? (
      <div className={cn('flex flex-wrap gap-1.5', compact ? 'mt-2' : 'gap-2')}>
        {resolvedActions.map((action) => (
          <SuggestedActionButton key={action.label} action={action} compact={compact} />
        ))}
      </div>
    ) : resolvedActions[0] ? (
      <SuggestedActionButton action={resolvedActions[0]} compact={compact} />
    ) : null;

  if (compact) {
    return (
      <div className={cn('min-w-0 flex-1', className)}>
        <p className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>
          {label}
        </p>
        <p className='mt-0.5 truncate text-xs font-medium' title={description}>
          {description}
        </p>
        {actionButtons ? (
          <div className={resolvedActions.length === 1 ? 'mt-2' : undefined}>{actionButtons}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</p>
        <p className='text-foreground mt-1 text-sm leading-relaxed'>{description}</p>
      </div>
      {actionButtons ? (
        <div className={cn('shrink-0', resolvedActions.length > 1 && 'sm:max-w-[14rem]')}>
          {actionButtons}
        </div>
      ) : null}
    </div>
  );
}
