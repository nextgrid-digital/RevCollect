import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxAiInsightCardProps {
  text: string;
}

export function InboxAiInsightCard({ text }: InboxAiInsightCardProps) {
  return (
    <InboxContextRailSection label='AI insight' unstyled>
      <p className='text-foreground rounded-lg bg-amber-50/90 px-3 py-2.5 text-sm leading-relaxed ring-1 ring-amber-100 dark:bg-amber-950/30 dark:ring-amber-900/40'>
        {text}
      </p>
    </InboxContextRailSection>
  );
}
