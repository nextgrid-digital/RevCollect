'use client';

import { useCallback, useRef, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { agentConfig, getAiDraftForMessage } from '../../mock-data';
import type { Customer, InboxMessage, ThreadEmail } from '../../types';
import { CustomerContextPanel } from '../../components/customer-context-panel';
import { ConversationThread } from './conversation-thread';
import { InboxFloatingComposer } from './inbox-floating-composer';

/** w-64 panel + right inset + gap — content padding only, no width clip */
const FLOATING_PANEL_RESERVE = 'calc(16rem + 2rem)';
const DEFAULT_COMPOSER_RESERVE = '11rem';

interface InboxConversationPaneProps {
  customer: Customer;
  selectedMessage: InboxMessage;
  threadEmails: ThreadEmail[];
  threadSummary: string;
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
  isMobile,
  onBack,
  contextOpen,
  onContextOpenChange
}: InboxConversationPaneProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const composerHeightRef = useRef(0);

  const handleComposerHeight = useCallback((height: number) => {
    paneRef.current?.style.setProperty('--inbox-composer-height', `${height}px`);

    const scrollEl = threadScrollRef.current;
    if (!scrollEl) {
      composerHeightRef.current = height;
      return;
    }

    const distanceFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    const wasNearBottom = composerHeightRef.current === 0 || distanceFromBottom < 64;

    if (wasNearBottom) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }

    composerHeightRef.current = height;
  }, []);

  return (
    <div
      ref={paneRef}
      className='bg-background relative flex min-h-0 min-w-0 flex-1 flex-col'
      style={
        {
          '--inbox-panel-reserve': FLOATING_PANEL_RESERVE,
          '--inbox-composer-height': DEFAULT_COMPOSER_RESERVE
        } as CSSProperties
      }
    >
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
              <CustomerContextPanel
                customer={customer}
                threadSubject={selectedMessage.subject}
                threadSummary={threadSummary}
              />
            </SheetContent>
          </Sheet>
        </div>
      ) : null}

      <div
        ref={threadScrollRef}
        className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scroll-padding-bottom:var(--inbox-composer-height)] px-4 py-3 md:pr-5 lg:pr-[var(--inbox-panel-reserve)] xl:py-4'
      >
        <ConversationThread emails={threadEmails} />
      </div>

      <InboxFloatingComposer
        key={selectedMessage.id}
        draft={getAiDraftForMessage(selectedMessage.id)}
        customerStatus={customer.status}
        defaultTone={agentConfig.tone}
        overlayClassName='lg:pr-[var(--inbox-panel-reserve)]'
        onOverlayHeightChange={handleComposerHeight}
      />
    </div>
  );
}
