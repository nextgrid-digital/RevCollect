'use client';

import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getToneLabel } from '../composer-options';
import type { AgentDraftMeta, CollectionStatus } from '../../types';
import { InboxFloatingOverlay } from './inbox-floating-overlay';
import { InboxReplyComposer, type InboxReplyComposerHandle } from './inbox-reply-composer';

interface InboxAgentDraftPanelProps {
  draftMeta: AgentDraftMeta;
  customerStatus: CollectionStatus;
  baseDraft: string;
  floating?: boolean;
  inline?: boolean;
  docked?: boolean;
  attachedInvoiceCount?: number;
  onOverlayHeightChange?: (height: number) => void;
  className?: string;
}

export function InboxAgentDraftPanel({
  draftMeta,
  customerStatus,
  baseDraft,
  floating = false,
  inline = false,
  docked = false,
  attachedInvoiceCount = 0,
  onOverlayHeightChange,
  className
}: InboxAgentDraftPanelProps) {
  const composerRef = useRef<InboxReplyComposerHandle>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [rewriteContext, setRewriteContext] = useState('');

  useEffect(() => {
    setIsMinimized(false);
    setRewriteContext('');
  }, [draftMeta]);

  const handleSendAsIs = () => {
    composerRef.current?.send();
  };

  const handleEditFirst = () => {
    setIsMinimized(false);
    requestAnimationFrame(() => {
      composerRef.current?.focusEditor();
    });
  };

  const dockedContent = (
    <article
      id='agent-draft-panel'
      className={cn(
        'border-border/60 bg-violet-50/90 flex w-full min-w-0 flex-col border-t px-4 py-4 dark:bg-violet-950/40',
        className
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center gap-1 text-sm font-semibold'>
              <Icons.sparkles className='text-violet-600 size-4 dark:text-violet-400' />
              AI-drafted reply
            </span>
            <Badge
              variant='outline'
              className='border-violet-200 bg-violet-100/80 text-[10px] font-medium text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200'
            >
              {getToneLabel(draftMeta.tone)}
            </Badge>
          </div>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            Based on thread context + payment history
          </p>
        </div>
      </div>

      <InboxReplyComposer
        ref={composerRef}
        bodyCollapsed={isMinimized}
        baseDraft={baseDraft}
        customerStatus={customerStatus}
        defaultTone={draftMeta.tone}
        initialBody={draftMeta.body}
        defaultAutoRun
        className='mt-3'
      />

      <div className='mt-3 space-y-3'>
        {attachedInvoiceCount > 0 ? (
          <p className='text-muted-foreground text-xs'>
            {attachedInvoiceCount} {attachedInvoiceCount === 1 ? 'invoice' : 'invoices'}{' '}
            auto-attached
          </p>
        ) : null}

        <Input
          value={rewriteContext}
          onChange={(e) => setRewriteContext(e.target.value)}
          placeholder='Add context for AI to rewrite'
          className='h-9 bg-background/80 text-sm'
        />

        <div className='flex flex-wrap justify-end gap-2'>
          <Button type='button' size='sm' variant='outline' onClick={handleEditFirst}>
            Edit first
          </Button>
          <Button type='button' size='sm' onClick={handleSendAsIs}>
            Send as-is
          </Button>
        </div>
      </div>
    </article>
  );

  const content = docked ? (
    dockedContent
  ) : (
    <article
      id='agent-draft-panel'
      className={cn(
        'relative w-full min-w-0',
        inline &&
          'rounded-2xl bg-violet-50/90 px-4 py-4 ring-1 ring-violet-100 dark:bg-violet-950/40 dark:ring-violet-900/50',
        !inline &&
          isMinimized &&
          'rounded-[16px] bg-white/95 px-3.5 py-3 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/95 dark:ring-neutral-800',
        className
      )}
    >
      {!inline ? (
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
      ) : null}

      {isMinimized && !inline ? (
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
        <div className={cn('mb-2 min-w-0', !inline && 'pr-8')}>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase dark:bg-violet-500'>
              <Icons.sparkles className='size-3' aria-hidden />
              Agent
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
          {inline ? (
            <div className='mt-4 flex flex-wrap gap-2'>
              <Button type='button' size='sm' onClick={handleSendAsIs}>
                Send as-is
              </Button>
              <Button type='button' size='sm' variant='outline' onClick={handleEditFirst}>
                Edit first
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {!docked ? (
        <InboxReplyComposer
          ref={composerRef}
          bodyCollapsed={isMinimized}
          baseDraft={baseDraft}
          customerStatus={customerStatus}
          defaultTone={draftMeta.tone}
          initialBody={draftMeta.body}
          defaultAutoRun
          className={isMinimized ? 'pt-2' : 'pt-1'}
        />
      ) : null}
    </article>
  );

  if (floating) {
    return (
      <InboxFloatingOverlay onHeightChange={onOverlayHeightChange}>{content}</InboxFloatingOverlay>
    );
  }

  return content;
}
