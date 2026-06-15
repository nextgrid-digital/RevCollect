'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getToneLabel } from '../composer-options';
import type { AgentDraftMeta, CollectionStatus } from '../../types';
import { InboxFloatingOverlay } from './inbox-floating-overlay';
import { InboxReplyComposer } from './inbox-reply-composer';

interface InboxAgentDraftPanelProps {
  draftMeta: AgentDraftMeta;
  customerStatus: CollectionStatus;
  baseDraft: string;
  floating?: boolean;
  onOverlayHeightChange?: (height: number) => void;
  className?: string;
}

export function InboxAgentDraftPanel({
  draftMeta,
  customerStatus,
  baseDraft,
  floating = false,
  onOverlayHeightChange,
  className
}: InboxAgentDraftPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setIsMinimized(false);
  }, [draftMeta]);

  const content = (
    <article
      className={cn(
        'relative w-full min-w-0',
        isMinimized &&
          'rounded-[16px] bg-white/95 px-3.5 py-3 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/95 dark:ring-neutral-800',
        className
      )}
    >
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='absolute top-1.5 right-1.5 z-10 size-7 shrink-0'
        onClick={() => setIsMinimized((prev) => !prev)}
        aria-label={isMinimized ? 'Expand agent draft' : 'Minimize agent draft'}
        aria-expanded={!isMinimized}
      >
        {isMinimized ? (
          <Icons.chevronDown className='size-4' />
        ) : (
          <Icons.chevronUp className='size-4' />
        )}
      </Button>

      {isMinimized ? (
        <button
          type='button'
          className='block w-full pr-8 text-left'
          onClick={() => setIsMinimized(false)}
        >
          <div className='flex flex-wrap items-center gap-1.5'>
            <span className='inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase dark:bg-violet-500'>
              <Icons.sparkles className='size-3' aria-hidden />
              Agent drafted
            </span>
            <Badge
              variant='outline'
              className='border-violet-200 bg-violet-100/80 text-[10px] font-medium text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200'
            >
              {getToneLabel(draftMeta.tone)}
            </Badge>
          </div>
          <h3 className='mt-1.5 text-sm leading-snug font-semibold'>{draftMeta.title}</h3>
          <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
            Prepared at {draftMeta.preparedAtLabel} · Tap to review and send
          </p>
        </button>
      ) : (
        <div className='mb-2 min-w-0 pr-8'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase dark:bg-violet-500'>
              <Icons.sparkles className='size-3' aria-hidden />
              Agent drafted
            </span>
            <Badge
              variant='outline'
              className='border-violet-200 bg-violet-100/80 text-[10px] font-medium text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200'
            >
              {getToneLabel(draftMeta.tone)}
            </Badge>
          </div>
          <h3 className='mt-2 text-sm leading-snug font-semibold'>{draftMeta.title}</h3>
          <p className='text-muted-foreground mt-1 text-xs'>
            Draft prepared at {draftMeta.preparedAtLabel} based on overnight analysis
          </p>
        </div>
      )}

      <InboxReplyComposer
        bodyCollapsed={isMinimized}
        baseDraft={baseDraft}
        customerStatus={customerStatus}
        defaultTone={draftMeta.tone}
        initialBody={draftMeta.body}
        defaultAutoRun
        className={isMinimized ? 'pt-2' : 'pt-1'}
      />
    </article>
  );

  if (floating) {
    return (
      <InboxFloatingOverlay onHeightChange={onOverlayHeightChange}>{content}</InboxFloatingOverlay>
    );
  }

  return content;
}
