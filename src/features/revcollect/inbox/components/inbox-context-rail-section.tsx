import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { InboxContextSectionLabel } from './inbox-context-section-label';

interface InboxContextRailSectionProps {
  label?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  unstyled?: boolean;
}

export function InboxContextRailSection({
  label,
  children,
  className,
  contentClassName,
  unstyled = false
}: InboxContextRailSectionProps) {
  return (
    <section className={cn('w-full shrink-0', className)}>
      {label ? <InboxContextSectionLabel>{label}</InboxContextSectionLabel> : null}
      {unstyled ? (
        <div className={cn(label ? 'mt-1.5' : undefined, contentClassName)}>{children}</div>
      ) : (
        <div
          className={cn(
            'bg-card overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/60',
            label ? 'mt-1.5' : undefined,
            contentClassName
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
