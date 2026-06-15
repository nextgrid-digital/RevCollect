'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ConversationThread } from './conversation-thread';
import { InboxAgentDraftPanel } from './inbox-agent-draft-panel';
import { InboxThreadActionBar } from './inbox-thread-action-bar';

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
  highlightedEmailId,
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
  const [composerPad, setComposerPad] = useState(0);

  const latestCustomerEmailId = useMemo(() => {
    for (let i = threadEmails.length - 1; i >= 0; i -= 1) {
      if (threadEmails[i]?.author === 'customer') return threadEmails[i]!.id;
    }
    return undefined;
  }, [threadEmails]);

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

  useEffect(() => {
    if (!agentDraftMeta) {
      setComposerPad(0);
    }
  }, [agentDraftMeta]);

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

      <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
        <div
          ref={threadScrollRef}
          className='scroll-stable min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 md:pr-5 xl:py-4'
          style={composerPad > 0 ? { paddingBottom: composerPad } : undefined}
        >
          <ConversationThread
            emails={threadEmails}
            highlightedEmailId={highlightedEmailId}
            customerName={customer.name}
            customerCompany={customer.company}
            customerAvatarUrl={customer.avatarUrl}
            latestCustomerEmailId={latestCustomerEmailId}
            replyIntentLabel={selectedMessage.replyIntentLabel}
          />
        </div>

        {agentDraftMeta ? (
          <InboxAgentDraftPanel
            floating
            draftMeta={agentDraftMeta}
            customerStatus={customer.status}
            baseDraft={aiDraftBase ?? ''}
            onOverlayHeightChange={setComposerPad}
          />
        ) : null}
      </div>
    </div>
  );
}
