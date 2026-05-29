'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { InboxConversationPane } from './inbox-conversation-pane';
import { InboxContextSidebar } from './inbox-context-sidebar';
import { useInboxContextRail } from './inbox-context-rail-context';
import { InboxMessageListHeader } from './inbox-message-list-header';
import { InboxMessageListSidebar } from './inbox-message-list-sidebar';
import { EmailThreadHeader } from './email-thread-header';
import { filterInboxMessages, type InboxListFilter } from '../lib/filter-inbox-messages';
import {
  getAiSummaryForThread,
  getCustomerById,
  getCustomerInboxContext,
  getEscalationInsightForCustomer,
  getThreadEmails,
  getTimelineForCustomer,
  inboxMessages
} from '../../mock-data';
import { useIsMobile } from '@/hooks/use-mobile';

/** Shared padding for list + thread header bands (top-aligned in lg grid row). */
const inboxHeaderBandClass = 'flex min-h-0 flex-col justify-start pt-2 pb-2';

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsLgUp(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return isLgUp;
}

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
  const isLgUp = useIsLgUp();
  const { setRailContent } = useInboxContextRail();
  const initialSelectedId = inboxMessages.find((m) => m.unread)?.id ?? inboxMessages[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilter, setListFilter] = useState<InboxListFilter>('all');
  const [mobilePane, setMobilePane] = useState<'list' | 'thread'>('list');
  const [contextOpen, setContextOpen] = useState(false);
  const [highlightedEmailId, setHighlightedEmailId] = useState<string | null>(null);
  const [scrollToEmailId, setScrollToEmailId] = useState<string | null>(null);

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
      if (selectedId !== '') setSelectedId('');
      return;
    }
    if (!filteredMessages.some((m) => m.id === selectedId)) {
      setSelectedId(filteredMessages[0]!.id);
    }
  }, [filteredMessages, selectedId]);

  const selectedMessage = inboxMessages.find((m) => m.id === selectedId);
  const customer = selectedMessage ? getCustomerById(selectedMessage.customerId) : undefined;
  const threadEmails = selectedMessage ? getThreadEmails(selectedMessage.id) : [];

  useEffect(() => {
    setHighlightedEmailId(null);
    setScrollToEmailId(null);
  }, [selectedId]);

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

  const handleSelectMessage = useCallback(
    (messageId: string) => {
      setSelectedId(messageId);
      if (isMobile) {
        setMobilePane('thread');
      }
    },
    [isMobile]
  );

  const threadSummary = selectedMessage ? getAiSummaryForThread(selectedMessage.id) : '';
  const inboxContext = customer ? getCustomerInboxContext(customer.id, customer) : undefined;
  const escalationInsight = customer ? getEscalationInsightForCustomer(customer.id) : undefined;
  const timelineEvents = customer ? getTimelineForCustomer(customer.id) : [];
  const aiInsightText =
    inboxContext?.aiInsight || (threadSummary && selectedMessage ? threadSummary : '');
  const latestEmail = threadEmails[threadEmails.length - 1];

  const showList = !isMobile || mobilePane === 'list';
  const showThread = !isMobile || mobilePane === 'thread';
  const useUnifiedHeader = isLgUp;

  const railContent = useMemo(() => {
    if (!isLgUp || !customer || !inboxContext) {
      return null;
    }

    return (
      <InboxContextSidebar
        showHeader
        customer={customer}
        inboxContext={inboxContext}
        aiInsightText={aiInsightText}
        escalationInsight={escalationInsight}
        timelineEvents={timelineEvents}
        threadEmails={threadEmails}
        onActivityEmailClick={handleActivityEmailClick}
      />
    );
  }, [
    isLgUp,
    customer,
    inboxContext,
    aiInsightText,
    escalationInsight,
    timelineEvents,
    threadEmails,
    handleActivityEmailClick
  ]);

  useEffect(() => {
    setRailContent(railContent);
    return () => setRailContent(null);
  }, [railContent, setRailContent]);

  return (
    <div className='flex max-h-[calc(100dvh-var(--header-height)-1rem)] min-h-0 w-full flex-1 flex-col overflow-hidden'>
      {useUnifiedHeader ? (
        <div className='border-border/60 grid shrink-0 grid-cols-[22rem_minmax(0,1fr)] items-start border-b'>
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
      ) : null}

      <SidebarProvider className='flex w-full flex-1 flex-row overflow-hidden !h-auto !min-h-0'>
        <InboxMessageListSidebar
          showHeader={!useUnifiedHeader}
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
          selectedId={selectedId}
          onSelectMessage={handleSelectMessage}
          getCustomerById={getCustomerById}
          emptyMessage={getListEmptyMessage(listFilter, searchQuery, false)}
        />

        <SidebarInset
          className={cn(
            'min-h-0 min-w-0',
            showThread ? 'flex flex-1 flex-col' : 'hidden md:flex md:flex-1 md:flex-col'
          )}
        >
          {!useUnifiedHeader ? (
            <div
              className={cn(
                inboxHeaderBandClass,
                'border-border/60 hidden shrink-0 border-b md:flex',
                !showThread && 'md:hidden'
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
          ) : null}

          {selectedMessage && customer ? (
            <InboxConversationPane
              customer={customer}
              selectedMessage={selectedMessage}
              threadEmails={threadEmails}
              threadSummary={threadSummary}
              inboxContext={inboxContext}
              escalationInsight={escalationInsight}
              timelineEvents={timelineEvents}
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
