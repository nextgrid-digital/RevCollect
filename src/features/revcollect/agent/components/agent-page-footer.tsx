'use client';

import { Button } from '@/components/ui/button';
import { formatCurrencyWhole } from '../../utils';

interface AgentPageFooterProps {
  priceMonthlyCents: number;
  estimatedAiCostMonthlyCents: number;
  subscribed: boolean;
  isActive: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onPreview: () => void;
  onSave: () => void;
  onActivate: () => void;
}

export function AgentPageFooter({
  priceMonthlyCents,
  estimatedAiCostMonthlyCents,
  subscribed,
  isActive,
  hasUnsavedChanges,
  isSaving,
  onPreview,
  onSave,
  onActivate
}: AgentPageFooterProps) {
  return (
    <div className='border-border/60 bg-background/95 sticky bottom-0 -mx-4 mt-8 border-t px-4 py-4 backdrop-blur-sm sm:-mx-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-sm'>
            {formatCurrencyWhole(priceMonthlyCents)}/month add-on · AI cost ~
            {formatCurrencyWhole(estimatedAiCostMonthlyCents)}/mo
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Your settings below control how the agent drafts and when it notifies you.
            {hasUnsavedChanges ? ' Unsaved changes.' : null}
          </p>
          {!subscribed ? (
            <p className='text-muted-foreground mt-1 text-xs'>
              Step 1: Subscribe in Billing · Step 2: Activate here
            </p>
          ) : null}
        </div>
        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          <Button type='button' variant='outline' onClick={onPreview}>
            See drafts in Inbox
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            Save changes
          </Button>
          {!isActive && subscribed ? (
            <Button type='button' onClick={onActivate} disabled={isSaving}>
              Activate agent
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
