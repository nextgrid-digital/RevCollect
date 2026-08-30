'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import type { AgentConfig } from '../../types';
import { formatCurrencyWhole } from '../../utils';
import { followUpStyleLabel } from '../lib/follow-up-style';
import { AgentJobStory } from './agent-job-story';
import { AgentSetupTimeline, type WizardStepId } from './agent-setup-timeline';

interface AgentOverviewTabProps {
  draft: AgentConfig;
  priceMonthlyCents: number;
  onActiveChange: (isActive: boolean) => void;
  onChangeSettings: () => void;
  onSetupAgain: () => void;
  onJumpToStep: (step: WizardStepId) => void;
}

export function AgentOverviewTab({
  draft,
  priceMonthlyCents,
  onActiveChange,
  onChangeSettings,
  onSetupAgain,
  onJumpToStep
}: AgentOverviewTabProps) {
  const overrideCount = draft.customerOverrides.length;
  const chaseFromDays = draft.riskThresholds.watchDays[0];
  const customerToneLabel =
    overrideCount === 0
      ? 'No customers have a custom tone.'
      : overrideCount === 1
        ? '1 customer has a custom tone.'
        : `${overrideCount} customers have a custom tone.`;

  return (
    <div className='flex flex-col gap-4'>
      <AgentSetupTimeline currentStep='complete' onStepSelect={onJumpToStep} />

      <WorkspaceCard className='p-4 md:p-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0'>
            <p className='text-sm font-medium'>{draft.isActive ? 'On' : 'Paused'}</p>
            <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
              Reminders sound{' '}
              <span className='text-foreground font-medium'>
                {followUpStyleLabel(draft.followUpStyle)}
              </span>
              . Chase from <span className='text-foreground font-medium'>{chaseFromDays} days</span>{' '}
              overdue. {customerToneLabel}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2'>
              <Switch
                id='agent-enabled'
                checked={draft.isActive}
                onCheckedChange={onActiveChange}
                aria-label='Payment reminders on'
              />
              <Label htmlFor='agent-enabled' className='text-sm font-medium'>
                {draft.isActive ? 'On' : 'Paused'}
              </Label>
            </div>
            <span className='bg-secondary text-secondary-foreground inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-normal'>
              Add-on · {formatCurrencyWhole(priceMonthlyCents)}/mo
            </span>
          </div>
        </div>
      </WorkspaceCard>

      <WorkspaceCard className='p-4 md:p-5'>
        <AgentJobStory compact />
      </WorkspaceCard>

      <div className='flex flex-wrap gap-2'>
        <Button asChild size='sm'>
          <Link href='/inbox?filter=drafts'>See drafts in Inbox</Link>
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={onChangeSettings}>
          Change settings
        </Button>
        <Button type='button' size='sm' variant='ghost' onClick={onSetupAgain}>
          Set up again
        </Button>
      </div>
    </div>
  );
}
