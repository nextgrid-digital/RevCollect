'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type {
  AgentDraftMeta,
  Customer,
  CustomerInboxContext,
  InboxMessage,
  LastActionInsight,
  ThreadEmail,
  TimelineEvent
} from '../../types';
import { CustomerContextPanel } from '../../components/customer-context-panel';
import { getLatestCustomerEmail } from '../lib/get-latest-customer-email';
import { ConversationThread } from './conversation-thread';
import { InboxThreadActionBar } from './inbox-thread-action-bar';
import { InboxThreadComposer } from './inbox-thread-composer';

interface InboxConversationPaneProps {
  customer: Customer;
  selectedMessage: InboxMessage;
  threadEmails: ThreadEmail[];
  threadSummary: string;
  inboxContext?: CustomerInboxContext;
  deepAnalysisText?: string;
  timelineEvents: TimelineEvent[];
  highlightedEmailId?: string | null;
  scrollToEmailId?: string | null;
  onActivityEmailClick?: (emailId: string) => void;
  agentDraftMeta?: AgentDraftMeta;
  aiDraftBase?: string;
  lastAction?: LastActionInsight;
  isMobile: boolean;
  onBack: () => void;
  contextOpen: boolean;
  onContextOpenChange: (open: boolean) => void;
}

export function InboxConversationPane({
  customer,
  selectedMessage,
  threadEmails,
  threadSummary,
  inboxContext,
  deepAnalysisText,
  timelineEvents,
  scrollToEmailId,
  onActivityEmailClick,
  agentDraftMeta,
  aiDraftBase,
  lastAction,
  isMobile,
  onBack,
  contextOpen,
  onContextOpenChange
}: InboxConversationPaneProps) {
  const threadScrollRef = useRef<HTMLDivElement>(null);

  const replyToEmail = useMemo(() => getLatestCustomerEmail(threadEmails), [threadEmails]);

  useEffect(() => {
    if (!scrollToEmailId || !threadScrollRef.current) return;

    const frame = requestAnimationFrame(() => {
      const target = threadScrollRef.current?.querySelector(
        `[data-thread-email-id="${scrollToEmailId}"]`
      );
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollToEmailId]);

  const handleActivityEmailClick = useCallback(
    (emailId: string) => {
      onActivityEmailClick?.(emailId);
    },
    [onActivityEmailClick]
  );

  return (
    <div className='bg-background relative flex min-h-0 min-w-0 flex-1 flex-col'>
      {isMobile ? (
        <div className='flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2 lg:hidden'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-7 shrink-0'
            onClick={onBack}
          >
            <Icons.chevronLeft className='size-4' />
          </Button>
          <p className='min-w-0 flex-1 truncate text-center text-xs font-semibold'>
            {selectedMessage.subject}
          </p>
          <Sheet open={contextOpen} onOpenChange={onContextOpenChange}>
            <SheetTrigger asChild>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-7 shrink-0'
                aria-label='Open customer context'
              >
                <Icons.user className='size-3.5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-full p-0 sm:max-w-sm'>
              <SheetHeader className='sr-only'>
                <SheetTitle>{customer.name}</SheetTitle>
              </SheetHeader>
              {inboxContext ? (
                <CustomerContextPanel
                  customer={customer}
                  threadSubject={selectedMessage.subject}
                  threadSummary={threadSummary}
                  inboxContext={inboxContext}
                  deepAnalysisText={deepAnalysisText}
                  timelineEvents={timelineEvents}
                  threadEmails={threadEmails}
                  onActivityEmailClick={handleActivityEmailClick}
                />
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      ) : null}

      <InboxThreadActionBar
        lastAction={lastAction}
        outstandingCents={customer.balanceCents}
        suggestedAction={selectedMessage.suggestedAction}
      />

      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <div
          ref={threadScrollRef}
          className='scroll-stable min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 md:pr-5 xl:py-4'
        >
          <ConversationThread
            emails={threadEmails}
            customerName={customer.name}
            customerCompany={customer.company}
            latestCustomerEmailId={replyToEmail?.id}
            replyIntentLabel={selectedMessage.replyIntentLabel}
          />
          <div className='mt-4 shrink-0 pt-2'>
            <InboxThreadComposer
              agentDraftMeta={agentDraftMeta}
              aiDraftBase={aiDraftBase ?? ''}
              customerStatus={customer.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
