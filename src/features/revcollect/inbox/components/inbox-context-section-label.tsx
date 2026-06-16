import { cn } from '@/lib/utils';

interface InboxContextSectionLabelProps {
  children: string;
  className?: string;
}

export function InboxContextSectionLabel({ children, className }: InboxContextSectionLabelProps) {
  return (
    <p
      className={cn(
        'text-muted-foreground px-1 text-[11px] font-medium tracking-wide uppercase',
        className
      )}
    >
      {children}
    </p>
  );
}
