import { Button } from '@/components/ui/button';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxAiInsightCardProps {
  text: string;
  onDraftFollowUp?: () => void;
}

export function InboxAiInsightCard({ text, onDraftFollowUp }: InboxAiInsightCardProps) {
  return (
    <InboxContextRailSection label='AI insight' unstyled>
      <p className='text-foreground rounded-lg bg-violet-50/90 px-3 py-2.5 text-sm leading-relaxed ring-1 ring-violet-100 dark:bg-violet-950/40 dark:ring-violet-900/50'>
        {text}
      </p>
      {onDraftFollowUp ? (
        <Button type='button' size='sm' variant='outline' className='mt-2 w-full' onClick={onDraftFollowUp}>
          Draft follow-up
        </Button>
      ) : null}
    </InboxContextRailSection>
  );
}
