'use client';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export const SETUP_TIMELINE_STOPS = [
  { id: 1, label: 'What it does' },
  { id: 2, label: 'Email tone' },
  { id: 3, label: 'When to chase' },
  { id: 4, label: 'Special customers' }
] as const;

export type WizardStepId = (typeof SETUP_TIMELINE_STOPS)[number]['id'];

interface AgentSetupTimelineProps {
  currentStep: WizardStepId | 'complete';
  onStepSelect: (step: WizardStepId) => void;
}

export function AgentSetupTimeline({ currentStep, onStepSelect }: AgentSetupTimelineProps) {
  const activeStep: WizardStepId | null = currentStep === 'complete' ? null : currentStep;

  return (
    <nav aria-label='Setup steps'>
      <ol className='grid grid-cols-4'>
        {SETUP_TIMELINE_STOPS.map((stop, index) => {
          const isCurrent = activeStep !== null && stop.id === activeStep;
          const isDone = activeStep === null || stop.id < activeStep;
          const isLast = index === SETUP_TIMELINE_STOPS.length - 1;

          return (
            <li key={stop.id} className='relative flex flex-col items-center'>
              {isLast ? null : (
                <span
                  className={cn(
                    'absolute top-4 right-[calc(-50%+16px)] left-[calc(50%+16px)] h-px',
                    isDone ? 'bg-primary/50' : 'bg-border'
                  )}
                  aria-hidden
                />
              )}
              <button
                type='button'
                onClick={() => onStepSelect(stop.id)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={
                  isDone
                    ? `${stop.label}, completed`
                    : isCurrent
                      ? `${stop.label}, current step`
                      : stop.label
                }
                className='relative z-10 flex min-w-0 flex-col items-center gap-1.5 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    isDone && 'bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-foreground border-2',
                    !isDone && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? <Icons.check className='size-4' aria-hidden /> : stop.id}
                </span>
                <span
                  className={cn(
                    'w-full text-center text-xs leading-tight',
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {stop.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
