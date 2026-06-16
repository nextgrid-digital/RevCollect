'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileWorkspaceBar } from '@/components/layout/mobile-workspace-bar';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { workspaceListWidth } from '@/features/revcollect/lib/workspace-layout';
import type { Customer, InboxMessage } from '../../types';
import { getInboxThreadActionStatus } from '../lib/get-inbox-thread-action-status';
import { useInboxListState } from '../hooks/use-inbox-list-state';
import { useInboxOpenMode } from './inbox-open-mode-context';
import { InboxMessageList } from './inbox-message-list';
import { InboxMessageListTitle } from './inbox-message-list-header';
import { InboxThreadDetail } from './inbox-thread-detail';
import { InboxWorkspaceContextColumn } from './inbox-workspace-context-column';

function pickDefaultMessageId(
  messages: InboxMessage[],
  getCustomer: (id: string) => Customer | undefined
): string | null {
  for (const message of messages) {
    const customer = getCustomer(message.customerId);
    if (!customer) continue;
    if (getInboxThreadActionStatus(message, customer) === 'ai_draft_ready') {
      return message.id;
    }
  }

  for (const message of messages) {
    const customer = getCustomer(message.customerId);
    if (!customer) continue;
    if (getInboxThreadActionStatus(message, customer) === 'awaiting_reply') {
      return message.id;
    }
  }

  return messages[0]?.id ?? null;
}

interface InboxWorkspaceProps {
  messageId?: string | null;
}

export function InboxWorkspace({ messageId }: InboxWorkspaceProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { openMessage } = useInboxOpenMode();
  const listState = useInboxListState();

  const activeMessageId = messageId ?? null;
  const showListOnMobile = isMobile && !activeMessageId;
  const showThreadOnMobile = isMobile && Boolean(activeMessageId);

  useEffect(() => {
    if (isMobile || activeMessageId || listState.inboxMessages.length === 0) return;
    const defaultId = pickDefaultMessageId(listState.inboxMessages, listState.getCustomerById);
    if (defaultId) {
      router.replace(`/inbox/${defaultId}`, { scroll: false });
    }
  }, [activeMessageId, isMobile, listState.inboxMessages, router]);

  const handleSelectMessage = useCallback(
    (id: string) => {
      openMessage(id);
    },
    [openMessage]
  );

  const [activityEmailClickHandler, setActivityEmailClickHandler] = useState<
    (emailId: string) => void
  >(() => () => {});

  const handleActivityEmailClickReady = useCallback((handler: (emailId: string) => void) => {
    setActivityEmailClickHandler(() => handler);
  }, []);

  const listContent = (showListTitle: boolean) => (
    <InboxMessageList
      variant='workspace'
      showListTitle={showListTitle}
      className='min-h-0 flex-1'
      searchQuery={listState.searchQuery}
      onSearchChange={listState.setSearchQuery}
      listFilter={listState.listFilter}
      onFilterChange={listState.setListFilter}
      allCount={listState.allCount}
      needsAttentionCount={listState.needsAttentionCount}
      overdueCount={listState.overdueCount}
      draftsCount={listState.draftsCount}
      upToDateCount={listState.upToDateCount}
      disputesCount={listState.disputesCount}
      filteredMessages={listState.filteredMessages}
      selectedId={activeMessageId}
      onSelectMessage={handleSelectMessage}
      getCustomerById={listState.getCustomerById}
      emptyMessage={listState.emptyMessage}
    />
  );

  const listColumnMobile = (
    <div className='bg-sidebar text-sidebar-foreground flex h-full min-h-0 w-full flex-col overflow-hidden'>
      {listContent(true)}
    </div>
  );

  const listColumnDesktop = (
    <div className={cn('hidden min-h-0 min-w-0 flex-col gap-2 md:flex', workspaceListWidth)}>
      <InboxMessageListTitle className='h-8' />
      <WorkspaceCard variant='list' className='min-h-0 w-full min-w-0 flex-1'>
        {listContent(false)}
      </WorkspaceCard>
    </div>
  );

  const threadColumn = activeMessageId ? (
    <InboxThreadDetail
      messageId={activeMessageId}
      layout='workspace'
      hideContextRail
      onActivityEmailClickReady={handleActivityEmailClickReady}
      className='bg-background min-h-0 min-w-0 flex-1 overflow-hidden'
    />
  ) : (
    <div className='text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm'>
      Select a thread to get started
    </div>
  );

  const desktopWorkspace = activeMessageId ? (
    <div className='flex min-h-0 min-w-0 flex-1 gap-4'>
      {threadColumn}
      <InboxWorkspaceContextColumn
        messageId={activeMessageId}
        onActivityEmailClick={activityEmailClickHandler}
      />
    </div>
  ) : (
    threadColumn
  );

  if (isMobile) {
    return (
      <div className='bg-background flex h-full min-h-0 w-full flex-1 overflow-hidden'>
        {showListOnMobile ? listColumnMobile : null}
        {showThreadOnMobile ? (
          <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
            <MobileWorkspaceBar backHref='/inbox' backLabel='Inbox' />
            {threadColumn}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <WorkspaceCanvas>
      {listColumnDesktop}
      {desktopWorkspace}
    </WorkspaceCanvas>
  );
}
