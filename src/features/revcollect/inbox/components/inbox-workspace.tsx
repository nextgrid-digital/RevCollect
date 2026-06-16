'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useCustomers, useInboxMessages } from '../../api/queries';
import { filterInboxMessages, type InboxListFilter } from '../lib/filter-inbox-messages';
import type { Customer } from '../../types';
import { InboxMessageList } from './inbox-message-list';
import { InboxThreadDetail } from './inbox-thread-detail';

function getListEmptyMessage(
  filter: InboxListFilter,
  searchQuery: string,
  hasResults: boolean
): string {
  if (searchQuery.trim() && !hasResults) {
    return 'No threads match your search';
  }
  if (filter === 'all') return 'No threads';
  if (filter === 'overdue') return 'No overdue threads';
  if (filter === 'drafts') return 'No AI drafts ready';
  if (filter === 'replied') return 'No replied threads';
  return 'No dispute threads';
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilter, setListFilter] = useState<InboxListFilter>('all');
  const { data: inboxMessages = [] } = useInboxMessages();
  const { data: customers = [] } = useCustomers();

  const getCustomerById = useCallback(
    (id: string): Customer | undefined => customers.find((customer) => customer.id === id),
    [customers]
  );

  const allCount = inboxMessages.length;
  const overdueCount = useMemo(
    () => inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'overdue').length,
    [inboxMessages, getCustomerById]
  );
  const draftsCount = useMemo(
    () => inboxMessages.filter((m) => m.agentDraftReady).length,
    [inboxMessages]
  );
  const repliedCount = useMemo(
    () => inboxMessages.filter((m) => !m.unread).length,
    [inboxMessages]
  );
  const disputesCount = useMemo(
    () =>
      inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'in_dispute').length,
    [inboxMessages, getCustomerById]
  );

  const filteredMessages = useMemo(
    () => filterInboxMessages(inboxMessages, listFilter, searchQuery, getCustomerById),
    [inboxMessages, listFilter, searchQuery, getCustomerById]
  );

  const activeMessageId = messageId ?? null;
  const showListOnMobile = isMobile && !activeMessageId;
  const showThreadOnMobile = isMobile && Boolean(activeMessageId);

  useEffect(() => {
    if (isMobile || activeMessageId || inboxMessages.length === 0) return;
    const defaultId = pickDefaultMessageId(inboxMessages);
    if (defaultId) {
      router.replace(`/inbox/${defaultId}`);
    }
  }, [activeMessageId, inboxMessages, isMobile, router]);

  const handleSelectMessage = useCallback(
    (id: string) => {
      router.push(`/inbox/${id}`);
    },
    [router]
  );

  const listColumn = (
    <div
      className={cn(
        'border-border/60 flex h-full min-h-0 flex-col overflow-hidden border-r',
        isMobile ? 'w-full' : 'w-80 shrink-0'
      )}
    >
      <InboxMessageList
        className='min-h-0 flex-1'
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        listFilter={listFilter}
        onFilterChange={setListFilter}
        allCount={allCount}
        overdueCount={overdueCount}
        draftsCount={draftsCount}
        repliedCount={repliedCount}
        disputesCount={disputesCount}
        filteredMessages={filteredMessages}
        selectedId={activeMessageId}
        onSelectMessage={handleSelectMessage}
        getCustomerById={getCustomerById}
        emptyMessage={getListEmptyMessage(listFilter, searchQuery, filteredMessages.length > 0)}
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
