import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxAiInsightCardProps {
  text: string;
}

export function InboxAiInsightCard({ text }: InboxAiInsightCardProps) {
  return (
    <InboxContextRailSection label='AI insight' contentClassName='px-4 py-3'>
      <p className='bg-violet-50 text-foreground rounded-lg px-3 py-2.5 text-sm leading-relaxed ring-1 ring-violet-100 dark:bg-violet-950/40 dark:ring-violet-900/50'>
        {text}
      </p>
    </InboxContextRailSection>
  );
}
