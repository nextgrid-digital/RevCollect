'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useInboxListState } from '../hooks/use-inbox-list-state';
import { useInboxOpenMode } from './inbox-open-mode-context';
import { InboxMessageList } from './inbox-message-list';
import { InboxThreadDetail } from './inbox-thread-detail';

function pickDefaultMessageId(
  messages: { id: string; agentDraftReady?: boolean }[]
): string | null {
  const draft = messages.find((message) => message.agentDraftReady);
  return draft?.id ?? messages[0]?.id ?? null;
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
    const defaultId = pickDefaultMessageId(listState.inboxMessages);
    if (defaultId) {
      router.replace(`/inbox/${defaultId}`);
    }
  }, [activeMessageId, isMobile, listState.inboxMessages, router]);

  const handleSelectMessage = useCallback(
    (id: string) => {
      openMessage(id);
    },
    [openMessage]
  );

  const listColumn = (
    <div
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border flex h-full min-h-0 flex-col overflow-hidden border-r',
        isMobile ? 'w-full' : 'w-80 shrink-0'
      )}
    >
      <InboxMessageList
        variant='workspace'
        className='min-h-0 flex-1'
        searchQuery={listState.searchQuery}
        onSearchChange={listState.setSearchQuery}
        listFilter={listState.listFilter}
        onFilterChange={listState.setListFilter}
        allCount={listState.allCount}
        overdueCount={listState.overdueCount}
        draftsCount={listState.draftsCount}
        repliedCount={listState.repliedCount}
        disputesCount={listState.disputesCount}
        filteredMessages={listState.filteredMessages}
        selectedId={activeMessageId}
        onSelectMessage={handleSelectMessage}
        getCustomerById={listState.getCustomerById}
        emptyMessage={listState.emptyMessage}
      />
    </div>
  );

  const threadColumn = activeMessageId ? (
    <InboxThreadDetail messageId={activeMessageId} className='min-h-0 min-w-0 flex-1' />
  ) : (
    <div className='text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm'>
      Select a thread to get started
    </div>
  );

  return (
    <div className='flex h-full min-h-0 w-full flex-1 overflow-hidden'>
      {isMobile ? (
        <>
          {showListOnMobile ? listColumn : null}
          {showThreadOnMobile ? (
            <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
              <div className='border-border/60 shrink-0 border-b px-4 py-2'>
                <Link href='/inbox' className='text-primary text-sm font-medium hover:underline'>
                  ← Back to inbox
                </Link>
              </div>
              {threadColumn}
            </div>
          ) : null}
        </>
      ) : (
        <>
          {listColumn}
          {threadColumn}
        </>
      )}
    </div>
  );
}
