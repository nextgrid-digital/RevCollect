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

export function getInboxThreadHeroMessage(
  companyName: string,
  agentDraftMeta: AgentDraftMeta | undefined,
  unread: boolean
): string {
  const state = getInboxThreadHeroState(agentDraftMeta, unread);

  if (state === 'draft-ready') return `Reply ready for ${companyName}`;
  if (state === 'awaiting-reply') return `${companyName} is waiting`;
  return "You're up to date";
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
  const message = getInboxThreadHeroMessage(companyName, agentDraftMeta, unread);

  return (
    <div className={cn('text-muted-foreground shrink-0 text-xs', className)}>
      <p className='text-foreground/80 min-w-0 truncate font-medium'>{message}</p>
    </div>
  );
}
