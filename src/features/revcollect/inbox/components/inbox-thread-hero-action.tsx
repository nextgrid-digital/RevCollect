'use client';

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
  className?: string;
}

export function InboxThreadHeroAction({
  companyName,
  agentDraftMeta,
  unread,
  className
}: InboxThreadHeroActionProps) {
  const state = getInboxThreadHeroState(agentDraftMeta, unread);

  const message =
    state === 'draft-ready'
      ? `Reply ready for ${companyName}`
      : state === 'awaiting-reply'
        ? `${companyName} is waiting`
        : "You're up to date";

  return (
    <div className={cn('text-muted-foreground shrink-0 text-xs', className)}>
      <p className='text-foreground/80 min-w-0 truncate font-medium'>{message}</p>
    </div>
  );
}
