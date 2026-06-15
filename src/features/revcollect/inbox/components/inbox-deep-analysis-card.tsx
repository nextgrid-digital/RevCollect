import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxDeepAnalysisCardProps {
  text: string;
}

export function InboxDeepAnalysisCard({ text }: InboxDeepAnalysisCardProps) {
  return (
    <InboxContextRailSection label='Deep analysis' unstyled>
      <span className='mb-2 inline-flex rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-violet-700 uppercase dark:bg-violet-950/50 dark:text-violet-300'>
        Agent
      </span>
      <p className='text-foreground rounded-lg bg-violet-50/80 px-3 py-2.5 text-sm leading-relaxed ring-1 ring-violet-100 dark:bg-violet-950/30 dark:ring-violet-900/40'>
        {text}
      </p>
    </InboxContextRailSection>
  );
}
