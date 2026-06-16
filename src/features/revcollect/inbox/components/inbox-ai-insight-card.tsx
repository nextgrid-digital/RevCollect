import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxAiInsightCardProps {
  text: string;
  hideLabel?: boolean;
  variant?: 'default' | 'customer';
}

export function InboxAiInsightCard({
  text,
  hideLabel = false,
  variant = 'default'
}: InboxAiInsightCardProps) {
  const content = (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg px-3 py-2.5',
        variant === 'customer' ? 'bg-violet-50 dark:bg-violet-950/30' : 'bg-muted/40'
      )}
    >
      <Icons.sparkles className='text-muted-foreground mt-0.5 size-3.5 shrink-0' aria-hidden />
      <p className='text-foreground text-sm leading-relaxed'>{text}</p>
    </div>
  );

  if (hideLabel) {
    return content;
  }

  return (
    <InboxContextRailSection label='AI insight' unstyled>
      {content}
    </InboxContextRailSection>
  );
}
