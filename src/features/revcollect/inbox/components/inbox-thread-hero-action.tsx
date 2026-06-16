'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentDraftMeta } from '../../types';

export type InboxThreadHeroState = 'draft-ready' | 'awaiting-reply' | 'caught-up';

export function getInboxThreadHeroState(
  agentDraftMeta: AgentDraftMeta | undefined,
  unread: boolean
): InboxThreadHeroState {
  if (agentDraftMeta) return 'draft-ready';
  if (unread) return 'awaiting-reply';
  return 'caught-up';
}

interface InboxThreadHeroActionProps {
  companyName: string;
  agentDraftMeta?: AgentDraftMeta;
  unread: boolean;
  onPrimaryAction: () => void;
  className?: string;
}

export function InboxThreadHeroAction({
  companyName,
  agentDraftMeta,
  unread,
  onPrimaryAction,
  className
}: InboxThreadHeroActionProps) {
  const state = getInboxThreadHeroState(agentDraftMeta, unread);

  const message =
    state === 'draft-ready'
      ? `Reply ready for ${companyName}`
      : state === 'awaiting-reply'
        ? `${companyName} is waiting`
        : "You're up to date";

  const primaryLabel =
    state === 'draft-ready' ? 'Review & send' : state === 'awaiting-reply' ? 'Reply' : null;

  return (
    <div
      className={cn(
        'border-border/60 flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5',
        state === 'caught-up' ? 'bg-muted/30' : 'bg-muted/50',
        className
      )}
    >
      <p className='text-foreground min-w-0 truncate text-sm font-medium'>{message}</p>
      {primaryLabel ? (
        <Button type='button' size='sm' className='shrink-0' onClick={onPrimaryAction}>
          {primaryLabel}
        </Button>
      ) : null}
    </div>
  );
}
