import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxEscalationCardProps {
  text: string;
}

export function InboxEscalationCard({ text }: InboxEscalationCardProps) {
  return (
    <InboxContextRailSection label='Escalation' contentClassName='px-4 py-3'>
      <p className='bg-rose-50 text-foreground rounded-lg px-3 py-2.5 text-sm leading-relaxed ring-1 ring-rose-100 dark:bg-rose-950/40 dark:ring-rose-900/50'>
        {text}
      </p>
    </InboxContextRailSection>
  );
}
