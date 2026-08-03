'use client';

import { XeroConnectPrompt } from '@/features/revcollect/components/xero-connect-prompt';
import { useInboxOpenMode } from './inbox-open-mode-context';
import { useInboxListState } from '../hooks/use-inbox-list-state';
import { InboxMessageList } from './inbox-message-list';
import { InboxPeekCenterDialog } from './inbox-peek-center-dialog';
import { InboxPeekSidePanel } from './inbox-peek-side-panel';

export function InboxNotionView() {
  const { mode, peekMessageId, openMessage, closePeek } = useInboxOpenMode();
  const listState = useInboxListState();

  const sidePeekOpen = mode === 'side' && peekMessageId !== null;
  const centerPeekOpen = mode === 'center' && peekMessageId !== null;

  return (
    <>
      <div className='flex h-full min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden'>
        <div className='mx-auto w-full max-w-6xl px-4 pt-2 sm:px-6'>
          <XeroConnectPrompt />
        </div>
        <div className='flex min-h-0 w-full flex-1 justify-center overflow-hidden'>
          <div className='mx-auto flex h-full min-h-0 w-full max-w-6xl min-w-0 flex-col'>
            <InboxMessageList
              variant='notion'
              className='min-h-0 min-w-0 flex-1'
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
              selectedId={sidePeekOpen ? peekMessageId : null}
              onSelectMessage={openMessage}
              getCustomerById={listState.getCustomerById}
              emptyMessage={listState.emptyMessage}
            />
          </div>
        </div>
      </div>

      <InboxPeekSidePanel messageId={sidePeekOpen ? peekMessageId : null} onClose={closePeek} />

      <InboxPeekCenterDialog
        messageId={centerPeekOpen ? peekMessageId : null}
        onClose={closePeek}
      />
    </>
  );
}
