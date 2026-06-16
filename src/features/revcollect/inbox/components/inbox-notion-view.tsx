'use client';

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
      <div className='flex h-full min-h-0 w-full flex-1 overflow-hidden'>
        <InboxMessageList
          variant='notion'
          className='min-h-0 min-w-0 flex-1'
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
          selectedId={sidePeekOpen ? peekMessageId : null}
          onSelectMessage={openMessage}
          getCustomerById={listState.getCustomerById}
          emptyMessage={listState.emptyMessage}
        />

        {sidePeekOpen && peekMessageId ? (
          <InboxPeekSidePanel messageId={peekMessageId} onClose={closePeek} />
        ) : null}
      </div>

      <InboxPeekCenterDialog
        messageId={centerPeekOpen ? peekMessageId : null}
        onClose={closePeek}
      />
    </>
  );
}
