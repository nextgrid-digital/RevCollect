'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { getRevCollectService, MOCK_TENANT_ID } from '../../api';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { getLatestCustomerEmail } from '../lib/get-latest-customer-email';
import { InboxContextSidebar } from './inbox-context-sidebar';
import { InboxThreadComposer } from './inbox-thread-composer';
import { InboxThreadAttachmentProvider } from './inbox-thread-attachment-context';
import { InboxThreadToolbar } from './inbox-thread-toolbar';
import { ConversationThread } from './conversation-thread';
import { InboxThreadTransition } from './inbox-thread-transition';
import { focusInboxComposer } from '../lib/focus-inbox-composer';
import {
  scrollInboxThreadEmailIntoView,
  scrollInboxThreadToBottomAfterLayout
} from '../lib/scroll-inbox-reply-target';
import {
  inboxCanvasPadding,
  inboxCenterMaxWidth,
  inboxContextCard,
  inboxContextCardSticky,
  inboxContextWidth
} from '../lib/inbox-layout';
import { useRegisterInboxThreadEnter } from './inbox-thread-transition';

interface InboxThreadDetailProps {
  messageId: string;
  variant?: 'peek' | 'full';
  peekLayout?: 'side' | 'center';
  layout?: 'default' | 'workspace';
  hideContextRail?: boolean;
  highlightedEmailId?: string | null;
  scrollToEmailId?: string | null;
  scrollOnOpen?: 'auto' | 'smooth' | 'none';
  onClose?: () => void;
  onActivityEmailClickReady?: (handler: (emailId: string) => void) => void;
  className?: string;
}

export function InboxThreadDetail({
  messageId,
  variant = 'full',
  peekLayout = 'side',
  layout = 'default',
  hideContextRail = false,
  scrollToEmailId: scrollToEmailIdProp,
  scrollOnOpen = 'smooth',
  onActivityEmailClickReady,
  className
}: InboxThreadDetailProps) {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const {
    data: selection,
    isLoading,
    isFetching,
    isPlaceholderData
  } = useInboxSelectionData(messageId);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const [activityScrollEmailId, setActivityScrollEmailId] = useState<string | null>(null);
  const scrollToEmailId = scrollToEmailIdProp ?? activityScrollEmailId;
  const selectionMatchesMessage = selection?.message.id === messageId;

  const replyToEmail = useMemo(
    () =>
      selectionMatchesMessage && selection
        ? getLatestCustomerEmail(selection.threadEmails)
        : undefined,
    [selection, selectionMatchesMessage]
  );

  const initialAttachedInvoiceNumbers = useMemo(
    () =>
      selectionMatchesMessage && selection?.agentDraftMeta ? selection.openInvoiceNumbers : [],
    [selection, selectionMatchesMessage]
  );

  useEffect(() => {
    setActivityScrollEmailId(null);
  }, [messageId]);

  useLayoutEffect(() => {
    const container = threadScrollRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [messageId]);

  useEffect(() => {
    if (!selectionMatchesMessage || !selection) return;
    void getRevCollectService().logDataAccess({
      tenantId: getRevCollectService().getTenantId() ?? MOCK_TENANT_ID,
      action: 'thread.view',
      resourceType: 'inbox_thread',
      resourceId: messageId,
      metadata: { customerId: selection.customer.id }
    });
  }, [messageId, selection, selectionMatchesMessage]);

  const runOpenScroll = useCallback(() => {
    if (scrollToEmailId || !selectionMatchesMessage || !selection) return;

    const container = threadScrollRef.current;
    if (!container || scrollOnOpen === 'none') return;

    const behavior =
      scrollOnOpen === 'smooth' && !reduceMotion ? 'smooth' : ('auto' as ScrollBehavior);

    void scrollInboxThreadToBottomAfterLayout(container, { behavior }).then((scrolledToDraft) => {
      if (!selectionMatchesMessage) return;
      if (!scrolledToDraft && variant === 'peek') {
        focusInboxComposer();
      }
    });
  }, [reduceMotion, scrollOnOpen, scrollToEmailId, selection, selectionMatchesMessage, variant]);

  const canScrollAfterEnterRef = useRef(false);

  useRegisterInboxThreadEnter(
    useCallback(() => {
      canScrollAfterEnterRef.current = true;
      runOpenScroll();
    }, [runOpenScroll])
  );

  useEffect(() => {
    canScrollAfterEnterRef.current = false;
  }, [messageId]);

  useEffect(() => {
    if (!canScrollAfterEnterRef.current) return;
    runOpenScroll();
  }, [runOpenScroll, selectionMatchesMessage, selection?.message.id]);

  const handleActivityEmailClick = useCallback(
    (emailId: string) => {
      const container = threadScrollRef.current;
      if (!container || !selection) {
        setActivityScrollEmailId(emailId);
        return;
      }

      const latestCustomerEmailId = getLatestCustomerEmail(selection.threadEmails)?.id;
      if (emailId === latestCustomerEmailId) {
        void scrollInboxThreadToBottomAfterLayout(container, { behavior: 'smooth' });
        return;
      }

      scrollInboxThreadEmailIntoView(container, emailId, { behavior: 'smooth', block: 'start' });
    },
    [selection]
  );

  useEffect(() => {
    if (!hideContextRail) return;
    onActivityEmailClickReady?.(handleActivityEmailClick);
    return () => {
      onActivityEmailClickReady?.(() => {});
    };
  }, [handleActivityEmailClick, hideContextRail, onActivityEmailClickReady]);

  useEffect(() => {
    if (!scrollToEmailId || !threadScrollRef.current || !selectionMatchesMessage) return;

    const container = threadScrollRef.current;
    const frame = requestAnimationFrame(() => {
      const latestCustomerEmailId = selection
        ? getLatestCustomerEmail(selection.threadEmails)?.id
        : undefined;

      if (scrollToEmailId === latestCustomerEmailId) {
        void scrollInboxThreadToBottomAfterLayout(container, { behavior: 'smooth' });
        return;
      }

      scrollInboxThreadEmailIntoView(container, scrollToEmailId, {
        behavior: 'smooth',
        block: 'start'
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollToEmailId, selection, selectionMatchesMessage]);

  if (!selectionMatchesMessage) {
    if (!isLoading && !isFetching && !isPlaceholderData) {
      return (
        <div className='text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm'>
          Message not found
        </div>
      );
    }

    return <div className='bg-background min-h-0 flex-1' aria-hidden />;
  }

  if (!selection) {
    return <div className='bg-background min-h-0 flex-1' aria-hidden />;
  }

  const { customer, message, threadEmails, inboxContext, deepAnalysisText, aiInsightText } =
    selection;
  const mergedInsightText = [aiInsightText, deepAnalysisText].filter(Boolean).join(' ');

  const contextSidebarProps = {
    customer,
    inboxContext,
    aiInsightText: mergedInsightText,
    timelineEvents: selection.timelineEvents,
    threadEmails,
    onActivityEmailClick: handleActivityEmailClick
  };

  const showPeekMobileContext = variant === 'peek' && isMobile;

  return (
    <InboxThreadAttachmentProvider
      resetKey={messageId}
      initialAttachedInvoiceNumbers={initialAttachedInvoiceNumbers}
    >
      <div className={cn('bg-background flex min-h-0 min-w-0 flex-1 flex-col', className)}>
        <div className={cn('flex min-h-0 flex-1', layout === 'default' && inboxCanvasPadding)}>
          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-1 gap-4',
              layout === 'default' && 'mx-auto w-full max-w-6xl',
              layout === 'default' && peekLayout === 'center' && 'md:gap-3'
            )}
          >
            <div
              className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
              data-inbox-thread-pane
            >
              <div
                className={cn(
                  inboxCenterMaxWidth,
                  'shrink-0',
                  layout === 'workspace' && 'flex flex-col gap-2'
                )}
              >
                {variant !== 'peek' || showPeekMobileContext ? (
                  <InboxThreadToolbar
                    customer={customer}
                    message={message}
                    agentDraftMeta={selection.agentDraftMeta}
                    contextSidebar={<InboxContextSidebar {...contextSidebarProps} />}
                    showSubject={variant !== 'peek' && !(isMobile && layout === 'workspace')}
                    showHeroAction={variant !== 'peek'}
                    showBackButton={variant === 'full'}
                    className={
                      layout === 'workspace'
                        ? undefined
                        : variant === 'peek'
                          ? 'h-8'
                          : 'h-auto pt-1 pb-2'
                    }
                  />
                ) : null}
                {layout === 'workspace' ? (
                  <div className='border-border/60 border-b' aria-hidden />
                ) : null}
              </div>

              <div
                ref={threadScrollRef}
                data-inbox-thread-scroll
                className='scroll-stable min-h-0 flex-1 overflow-x-hidden overflow-y-auto'
              >
                <div className={cn(inboxCenterMaxWidth, 'flex min-h-full flex-col px-4 pb-2')}>
                  <InboxThreadTransition messageId={messageId} className='min-h-full flex-1'>
                    <ConversationThread
                      emails={threadEmails}
                      customerName={customer.name}
                      customerCompany={customer.company}
                      latestCustomerEmailId={replyToEmail?.id}
                      replyIntentLabel={message.replyIntentLabel}
                      autoScrollToLatestEmail={false}
                    />
                  </InboxThreadTransition>
                </div>
              </div>
              <div className={cn(inboxCenterMaxWidth, 'bg-background shrink-0 px-4 pt-3 pb-2')}>
                <InboxThreadComposer
                  agentDraftMeta={selection.agentDraftMeta}
                  aiDraftBase={selection.aiDraftBase}
                  customerStatus={customer.status}
                  customerId={customer.id}
                  autoFocus={variant === 'peek'}
                />
              </div>
            </div>

            {layout !== 'workspace' ? (
              <div
                className={cn(
                  'hidden min-h-0 shrink-0 flex-col self-stretch md:flex',
                  peekLayout === 'center' ? 'w-64' : inboxContextWidth
                )}
              >
                <div
                  className={cn(
                    inboxContextCard,
                    inboxContextCardSticky,
                    'flex min-h-0 w-full flex-1 flex-col'
                  )}
                >
                  <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl'>
                    <InboxContextSidebar {...contextSidebarProps} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </InboxThreadAttachmentProvider>
  );
}
