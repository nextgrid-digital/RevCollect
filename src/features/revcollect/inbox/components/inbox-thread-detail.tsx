'use client';

import { useMemo, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getRevCollectService, MOCK_TENANT_ID } from '../../api';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { getLatestCustomerEmail } from '../lib/get-latest-customer-email';
import { InboxContextSidebar } from './inbox-context-sidebar';
import { InboxThreadComposer } from './inbox-thread-composer';
import { InboxThreadAttachmentProvider } from './inbox-thread-attachment-context';
import { InboxThreadHeroAction } from './inbox-thread-hero-action';
import { InboxThreadToolbar } from './inbox-thread-toolbar';
import { ConversationThread } from './conversation-thread';
import { focusInboxComposer } from '../lib/focus-inbox-composer';

interface InboxThreadDetailProps {
  messageId: string;
  variant?: 'peek' | 'full';
  peekLayout?: 'side' | 'center';
  hideHeader?: boolean;
  highlightedEmailId?: string | null;
  scrollToEmailId?: string | null;
  onClose?: () => void;
  className?: string;
}

export function InboxThreadDetail({
  messageId,
  variant = 'full',
  peekLayout = 'side',
  scrollToEmailId,
  className
}: InboxThreadDetailProps) {
  const { data: selection } = useInboxSelectionData(messageId);
  const threadScrollRef = useRef<HTMLDivElement>(null);

  const replyToEmail = useMemo(
    () => (selection ? getLatestCustomerEmail(selection.threadEmails) : undefined),
    [selection]
  );

  const initialAttachedInvoiceNumbers = useMemo(
    () => (selection?.agentDraftMeta ? selection.openInvoiceNumbers : []),
    [selection]
  );

  const scrollToDraft = () => {
    document
      .getElementById('agent-draft-panel')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const scrollToComposer = useCallback(() => {
    const draftPanel = document.getElementById('agent-draft-panel');
    if (draftPanel) {
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    document
      .getElementById('inbox-thread-composer')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    focusInboxComposer();
  }, []);

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
    if (!selection) return;
    void getRevCollectService().logDataAccess({
      tenantId: getRevCollectService().getTenantId() ?? MOCK_TENANT_ID,
      action: 'thread.view',
      resourceType: 'inbox_thread',
      resourceId: messageId,
      metadata: { customerId: selection.customer.id }
    });
  }, [messageId, selection]);

  useEffect(() => {
    if (variant !== 'peek' || !selection || selection.agentDraftMeta) return;
    focusInboxComposer();
  }, [messageId, selection, variant]);

  if (!selection) {
    return (
      <div className='text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm'>
        Message not found
      </div>
    );
  }

  const { customer, message, threadEmails, inboxContext, deepAnalysisText, aiInsightText } =
    selection;
  const hasAgentDraft = Boolean(selection.agentDraftMeta);
  const mergedInsightText = [aiInsightText, deepAnalysisText].filter(Boolean).join(' ');

  return (
    <InboxThreadAttachmentProvider
      resetKey={messageId}
      initialAttachedInvoiceNumbers={initialAttachedInvoiceNumbers}
    >
      <div className={cn('bg-background flex min-h-0 min-w-0 flex-1 flex-col', className)}>
        <div className='flex min-h-0 flex-1 overflow-hidden'>
          <div
            className={cn(
              'flex min-w-0 flex-col overflow-hidden',
              peekLayout === 'center' ? 'min-w-[28rem] flex-[1.4]' : 'flex-1'
            )}
          >
            <InboxThreadToolbar customer={customer} message={message} />

            <InboxThreadHeroAction
              companyName={customer.company}
              agentDraftMeta={selection.agentDraftMeta}
              unread={message.unread}
              onPrimaryAction={hasAgentDraft ? scrollToDraft : scrollToComposer}
            />

            <div
              ref={threadScrollRef}
              className='scroll-stable min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3'
            >
              <ConversationThread
                emails={threadEmails}
                customerName={customer.name}
                customerCompany={customer.company}
                latestCustomerEmailId={replyToEmail?.id}
                replyIntentLabel={message.replyIntentLabel}
              />
              <div className='mt-4 shrink-0 pt-2'>
                <InboxThreadComposer
                  agentDraftMeta={selection.agentDraftMeta}
                  aiDraftBase={selection.aiDraftBase}
                  customerStatus={customer.status}
                  autoFocus={variant === 'peek'}
                />
              </div>
            </div>
          </div>

          <aside
            className={cn(
              'border-border/60 shrink-0 overflow-hidden border-l',
              peekLayout === 'center' ? 'w-72' : 'w-80'
            )}
          >
            <InboxContextSidebar
              customer={customer}
              inboxContext={inboxContext}
              aiInsightText={mergedInsightText}
              hasAgentDraft={hasAgentDraft}
              heroActionPresent
            />
          </aside>
        </div>
      </div>
    </InboxThreadAttachmentProvider>
  );
}
