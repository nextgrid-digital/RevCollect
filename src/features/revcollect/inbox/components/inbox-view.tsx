'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { StatusPill } from '../../components/status-pill';
import { InboxMessageListHeader } from './inbox-message-list-header';
import {
  CustomerContextPanelFloatingBody,
  CustomerContextPanelFloatingHeader
} from '../../components/customer-context-panel';
import { InboxConversationPane } from './inbox-conversation-pane';
import { InboxThreadSummaryCard } from './inbox-thread-summary-card';
import { EmailThreadHeader } from './email-thread-header';
import { formatRelativeDate } from '../../utils';
import { filterInboxMessages, type InboxListFilter } from '../lib/filter-inbox-messages';
import {
  getAiSummaryForThread,
  getCustomerById,
  getThreadEmails,
  inboxMessages
} from '../../mock-data';
import { useIsMobile } from '@/hooks/use-mobile';

const INBOX_PANEL_RESERVE = 'calc(16rem + 2rem)';

/** Shared padding for list + thread header bands (aligned in md grid row). */
const inboxHeaderBandClass = 'flex min-h-0 flex-col justify-center py-2';

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
  const initialSelectedId = inboxMessages.find((m) => m.unread)?.id ?? inboxMessages[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilter, setListFilter] = useState<InboxListFilter>('all');
  const [mobilePane, setMobilePane] = useState<'list' | 'thread'>('list');
  const [contextOpen, setContextOpen] = useState(false);

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
  const threadSummary = selectedMessage ? getAiSummaryForThread(selectedMessage.id) : '';
  const latestEmail = threadEmails[threadEmails.length - 1];

  const showList = !isMobile || mobilePane === 'list';
  const showThread = !isMobile || mobilePane === 'thread';

  return (
    <div
      className='flex h-[calc(100dvh-var(--header-height)-2rem)] max-h-[calc(100dvh-var(--header-height)-2rem)] min-h-0 flex-1 flex-col overflow-hidden md:grid md:grid-cols-[22rem_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)]'
      style={{ '--inbox-panel-reserve': INBOX_PANEL_RESERVE } as CSSProperties}
    >
      <div
        className={cn(
          inboxHeaderBandClass,
          'md:col-start-1 md:row-start-1',
          !showList && 'hidden md:flex'
        )}
      >
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

      <div
        className={cn(
          'min-h-0 overflow-y-auto py-1 pr-2 md:col-start-1 md:row-start-2 md:border-r md:pr-3',
          showList ? 'flex-1 md:flex-none' : 'hidden md:block'
        )}
      >
        {filteredMessages.length === 0 ? (
          <p className='text-muted-foreground px-2 py-8 text-center text-sm'>
            {getListEmptyMessage(listFilter, searchQuery, false)}
          </p>
        ) : (
          <ul className='divide-y'>
            {filteredMessages.map((message) => {
              const msgCustomer = getCustomerById(message.customerId);
              if (!msgCustomer) return null;

              return (
                <li key={message.id}>
                  <button
                    type='button'
                    onClick={() => {
                      setSelectedId(message.id);
                      if (isMobile) {
                        setMobilePane('thread');
                      }
                    }}
                    className={cn(
                      'hover:bg-muted/50 flex w-full gap-3 px-3 py-3 text-left transition-colors',
                      selectedId === message.id && 'bg-muted'
                    )}
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className={cn('truncate text-sm', message.unread && 'font-semibold')}>
                          {msgCustomer.company}
                        </span>
                        <time className='text-muted-foreground shrink-0 text-xs'>
                          {formatRelativeDate(message.receivedAt)}
                        </time>
                      </div>
                      <p className='truncate text-sm'>{message.subject}</p>
                      <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                        {message.preview}
                      </p>
                      <div className='mt-2'>
                        <StatusPill status={msgCustomer.status} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div
        className={cn(
          'relative flex min-h-0 min-w-0 flex-col md:col-start-2 md:row-start-1 md:row-span-2',
          showThread ? 'flex-1 md:flex-none' : 'hidden md:flex'
        )}
      >
        <div
          className={cn(
            inboxHeaderBandClass,
            'border-border/60 hidden shrink-0 border-b md:flex md:flex-row md:items-stretch',
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
          {customer && selectedMessage ? (
            <div className='hidden w-64 shrink-0 pr-2 pb-2 pl-2 lg:block'>
              <div className='overflow-hidden rounded-[16px] bg-white px-3 py-2 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'>
                <CustomerContextPanelFloatingHeader customer={customer} />
              </div>
            </div>
          ) : null}
        </div>

        <div className='relative flex min-h-0 min-w-0 flex-1 flex-col'>
          {customer && selectedMessage ? (
            <div className='pointer-events-auto absolute top-0 right-0 z-20 hidden w-64 flex-col gap-2 px-3 pt-3 lg:flex'>
              <div className='overflow-hidden rounded-[16px] bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'>
                <CustomerContextPanelFloatingBody customer={customer} />
              </div>
              {threadSummary ? (
                <InboxThreadSummaryCard subject={selectedMessage.subject} summary={threadSummary} />
              ) : null}
            </div>
          ) : null}

          {selectedMessage && customer ? (
            <InboxConversationPane
              customer={customer}
              selectedMessage={selectedMessage}
              threadEmails={threadEmails}
              threadSummary={threadSummary}
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
        </div>
      </div>
    </div>
  );
}
