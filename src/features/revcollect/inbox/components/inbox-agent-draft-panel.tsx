'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
  floating = true,
  onOverlayHeightChange,
  className
}: InboxAgentDraftPanelProps) {
  const [rewriteContext, setRewriteContext] = useState('');

  useEffect(() => {
    setRewriteContext('');
  }, [draftMeta]);

  const panel = (
    <article
      id='agent-draft-panel'
      className={cn(
        'bg-card flex w-full min-w-0 flex-col px-4 py-3 ring-1 ring-border',
        floating ? 'rounded-xl backdrop-blur-sm' : 'border-border/60 border-t',
        className
      )}
    >
      <span className='text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium'>
        <Icons.sparkles className='size-3.5 shrink-0' aria-hidden />
        AI draft
      </span>

      <InboxReplyComposer
        baseDraft={baseDraft}
        customerStatus={customerStatus}
        defaultTone={draftMeta.tone}
        initialBody={draftMeta.body}
        defaultAutoRun
        variant='agent-draft'
        className='mt-2'
      />

      <Input
        value={rewriteContext}
        onChange={(e) => setRewriteContext(e.target.value)}
        placeholder='Add context for AI to rewrite'
        className='mt-3 h-9 bg-background/80 text-sm'
      />
    </article>
  );

  if (floating) {
    return (
      <InboxFloatingOverlay
        className='border-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-6'
        onHeightChange={onOverlayHeightChange}
      >
        {panel}
      </InboxFloatingOverlay>
    );
  }

  return panel;
}
