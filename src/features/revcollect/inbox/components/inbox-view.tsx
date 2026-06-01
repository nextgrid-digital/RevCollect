'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { InboxConversationPane } from './inbox-conversation-pane';
import { useInboxContextRail } from './inbox-context-rail-context';
import { InboxMessageListHeader } from './inbox-message-list-header';
import { InboxMessageListSidebar } from './inbox-message-list-sidebar';
import { EmailThreadHeader } from './email-thread-header';
import { filterInboxMessages, type InboxListFilter } from '../lib/filter-inbox-messages';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { getCustomerById, inboxMessages } from '../../mock-data';
import { useIsMobile } from '@/hooks/use-mobile';

/** Shared padding for list + thread header bands (top-aligned in lg grid row). */
const inboxHeaderBandClass = 'flex min-h-0 flex-col justify-start pt-2 pb-2';

function getListEmptyMessage(
  filter: InboxListFilter,
  searchQuery: string,
  hasResults: boolean
): string {
  if (searchQuery.trim() && !hasResults) {
    return 'No emails match your search';
  }
  if (filter === 'all') return 'No emails';
  if (filter === 'overdue') return 'No overdue emails';
  if (filter === 'due_soon') return 'No due soon emails';
  return 'No escalated emails';
}

export function InboxView() {
  const isMobile = useIsMobile();
  const { selectedMessageId, setSelectedMessageId, registerActivityEmailClick } =
    useInboxContextRail();
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilter, setListFilter] = useState<InboxListFilter>('all');
  const [mobilePane, setMobilePane] = useState<'list' | 'thread'>('list');
  const [contextOpen, setContextOpen] = useState(false);
  const [highlightedEmailId, setHighlightedEmailId] = useState<string | null>(null);
  const [scrollToEmailId, setScrollToEmailId] = useState<string | null>(null);

  const selection = useInboxSelectionData(selectedMessageId);

  const allCount = inboxMessages.length;
  const overdueCount = useMemo(
    () => inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'overdue').length,
    []
  );
  const dueSoonCount = useMemo(
    () => inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'due_soon').length,
    []
  );
  const escalatedCount = useMemo(
    () =>
      inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'in_dispute').length,
    []
  );

  const filteredMessages = useMemo(
    () => filterInboxMessages(inboxMessages, listFilter, searchQuery, getCustomerById),
    [listFilter, searchQuery]
  );

  useEffect(() => {
    if (filteredMessages.length === 0) {
      if (selectedMessageId !== '') setSelectedMessageId('');
      return;
    }
    if (!filteredMessages.some((m) => m.id === selectedMessageId)) {
      setSelectedMessageId(filteredMessages[0]!.id);
    }
  }, [filteredMessages, selectedMessageId, setSelectedMessageId]);

  useEffect(() => {
    setHighlightedEmailId(null);
    setScrollToEmailId(null);
  }, [selectedMessageId]);

  useEffect(() => {
    if (!scrollToEmailId) return;
    const timeoutId = window.setTimeout(() => {
      setScrollToEmailId(null);
      setHighlightedEmailId(null);
    }, 2500);
    return () => window.clearTimeout(timeoutId);
  }, [scrollToEmailId]);

  const handleActivityEmailClick = useCallback(
    (emailId: string) => {
      setHighlightedEmailId(emailId);
      setScrollToEmailId(emailId);
      if (isMobile) {
        setMobilePane('thread');
      }
    },
    [isMobile]
  );

  useLayoutEffect(() => {
    registerActivityEmailClick(handleActivityEmailClick);
  }, [registerActivityEmailClick, handleActivityEmailClick]);

  const handleSelectMessage = useCallback(
    (messageId: string) => {
      setSelectedMessageId(messageId);
      if (isMobile) {
        setMobilePane('thread');
      }
    },
    [isMobile, setSelectedMessageId]
  );

  const showList = !isMobile || mobilePane === 'list';
  const showThread = !isMobile || mobilePane === 'thread';
  const latestEmail = selection?.latestEmail;

  return (
    <div className='flex max-h-[calc(100dvh-var(--header-height)-1rem)] min-h-0 w-full flex-1 flex-col overflow-hidden'>
      <div className='border-border/60 hidden shrink-0 grid-cols-[22rem_minmax(0,1fr)] items-start border-b lg:grid'>
        <div className={cn(inboxHeaderBandClass, 'px-3')}>
          <InboxMessageListHeader
            search={searchQuery}
            onSearchChange={setSearchQuery}
            filter={listFilter}
            onFilterChange={setListFilter}
            allCount={allCount}
            overdueCount={overdueCount}
            dueSoonCount={dueSoonCount}
            escalatedCount={escalatedCount}
          />
        </div>
        <div className={cn(inboxHeaderBandClass, 'px-4 md:pr-3')}>
          {latestEmail ? (
            <EmailThreadHeader email={latestEmail} className='py-0' />
          ) : (
            <p className='text-muted-foreground text-sm'>Select an email</p>
          )}
        </div>
      </div>

      <SidebarProvider className='flex w-full min-w-0 flex-1 flex-row overflow-hidden !h-auto !min-h-0'>
        <InboxMessageListSidebar
          showHeader
          listHeaderClassName='lg:hidden'
          visible={showList}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          listFilter={listFilter}
          onFilterChange={setListFilter}
          allCount={allCount}
          overdueCount={overdueCount}
          dueSoonCount={dueSoonCount}
          escalatedCount={escalatedCount}
          filteredMessages={filteredMessages}
          selectedId={selectedMessageId}
          onSelectMessage={handleSelectMessage}
          getCustomerById={getCustomerById}
          emptyMessage={getListEmptyMessage(listFilter, searchQuery, false)}
        />

        <SidebarInset
          className={cn(
            'min-h-0 min-w-0',
            showThread
              ? 'flex w-full min-w-0 flex-1 flex-col'
              : 'hidden md:flex md:w-auto md:min-w-0 md:flex-1 md:flex-col'
          )}
        >
          <div
            className={cn(
              inboxHeaderBandClass,
              'border-border/60 shrink-0 border-b lg:hidden',
              !showThread && 'hidden'
            )}
          >
            <div className='flex min-w-0 flex-1 flex-col justify-center px-4 md:pr-3'>
              {latestEmail ? (
                <EmailThreadHeader email={latestEmail} className='py-0' />
              ) : (
                <p className='text-muted-foreground text-sm'>Select an email</p>
              )}
            </div>
          </div>

          {selection ? (
            <InboxConversationPane
              customer={selection.customer}
              selectedMessage={selection.message}
              threadEmails={selection.threadEmails}
              threadSummary={selection.threadSummary}
              inboxContext={selection.inboxContext}
              escalationInsight={selection.escalationInsight}
              timelineEvents={selection.timelineEvents}
              highlightedEmailId={highlightedEmailId}
              scrollToEmailId={scrollToEmailId}
              onActivityEmailClick={handleActivityEmailClick}
              isMobile={isMobile}
              onBack={() => setMobilePane('list')}
              contextOpen={contextOpen}
              onContextOpenChange={setContextOpen}
            />
          ) : (
            <div className='text-muted-foreground flex flex-1 items-center justify-center px-4 py-8 text-sm md:hidden'>
              Select an email
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
