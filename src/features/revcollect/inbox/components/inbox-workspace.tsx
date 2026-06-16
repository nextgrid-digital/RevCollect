'use client';

import { useCallback, useState } from 'react';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { workspaceListWidth } from '@/features/revcollect/lib/workspace-layout';
import { useInboxListState } from '../hooks/use-inbox-list-state';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { useInboxOpenMode } from './inbox-open-mode-context';
import { InboxMessageList } from './inbox-message-list';
import { InboxMessageListTitle } from './inbox-message-list-header';
import { InboxThreadDetail } from './inbox-thread-detail';
import { InboxWorkspaceContextColumn } from './inbox-workspace-context-column';

interface InboxWorkspaceProps {
  messageId?: string | null;
}

export function InboxWorkspace({ messageId }: InboxWorkspaceProps) {
  const isMobile = useIsMobile();
  const { openMessage } = useInboxOpenMode();
  const listState = useInboxListState();

  const activeMessageId = messageId ?? null;
  const showListOnMobile = isMobile && !activeMessageId;
  const showThreadOnMobile = isMobile && Boolean(activeMessageId);

  const { data: selection } = useInboxSelectionData(activeMessageId);
  const messageSubject =
    selection?.message.id === activeMessageId ? selection.message.subject : '…';

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

  return (
    <WorkspaceCanvas>
      {isMobile ? (
        <div className='flex min-h-0 min-w-0 flex-1 flex-col gap-2 md:hidden'>
          {activeMessageId ? (
            <WorkspacePageTitle
              className='h-8 shrink-0'
              breadcrumbs={[{ label: 'Inbox', href: '/inbox' }, { label: messageSubject }]}
            />
          ) : (
            <InboxMessageListTitle className='h-8 shrink-0' />
          )}
          {showListOnMobile ? (
            <WorkspaceCard variant='list' className='min-h-0 w-full min-w-0 flex-1'>
              {listContent(false)}
            </WorkspaceCard>
          ) : null}
          {showThreadOnMobile ? threadColumn : null}
        </div>
      ) : (
        <>
          {listColumnDesktop}
          {desktopWorkspace}
        </>
      )}
    </WorkspaceCanvas>
  );
}
