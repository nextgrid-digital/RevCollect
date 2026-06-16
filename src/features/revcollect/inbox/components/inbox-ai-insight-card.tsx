import { Icons } from '@/components/icons';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxAiInsightCardProps {
  text: string;
  hideLabel?: boolean;
}

export function InboxAiInsightCard({ text, hideLabel = false }: InboxAiInsightCardProps) {
  const content = (
    <div className='flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5'>
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
