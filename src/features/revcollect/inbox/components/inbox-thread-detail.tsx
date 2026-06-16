'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getRevCollectService, MOCK_TENANT_ID } from '../../api';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { InboxContextSidebar } from './inbox-context-sidebar';
import { InboxThreadComposer } from './inbox-thread-composer';
import { InboxThreadToolbar } from './inbox-thread-toolbar';
import { ConversationThread } from './conversation-thread';

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
  peekLayout = 'side',
  highlightedEmailId,
  scrollToEmailId,
  className
}: InboxThreadDetailProps) {
  const { data: selection } = useInboxSelectionData(messageId);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const [composerPad, setComposerPad] = useState(0);

  const latestCustomerEmailId = useMemo(() => {
    if (!selection) return undefined;
    for (let i = selection.threadEmails.length - 1; i >= 0; i -= 1) {
      if (selection.threadEmails[i]?.author === 'customer') return selection.threadEmails[i]!.id;
    }
    return undefined;
  }, [selection]);

  const scrollToDraft = () => {
    document.getElementById('agent-draft-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

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
  const attachedInvoiceCount = selection.openInvoiceNumbers.length;
  const mergedInsightText = [aiInsightText, deepAnalysisText].filter(Boolean).join(' ');

  return (
    <div className={cn('bg-background flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <div
          className={cn(
            'relative flex min-w-0 flex-col overflow-hidden',
            peekLayout === 'center' ? 'min-w-[28rem] flex-[1.4]' : 'flex-1'
          )}
        >
          <InboxThreadToolbar
            customer={customer}
            message={message}
            invoiceNumbers={selection.openInvoiceNumbers}
            onReply={scrollToDraft}
          />

          <div
            ref={threadScrollRef}
            className='scroll-stable min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3'
            style={!hasAgentDraft && composerPad > 0 ? { paddingBottom: composerPad } : undefined}
          >
            <ConversationThread
              emails={threadEmails}
              highlightedEmailId={highlightedEmailId}
              customerName={customer.name}
              customerCompany={customer.company}
              customerAvatarUrl={customer.avatarUrl}
              latestCustomerEmailId={latestCustomerEmailId}
              replyIntentLabel={message.replyIntentLabel}
            />
          </div>

          <InboxThreadComposer
            agentDraftMeta={selection.agentDraftMeta}
            aiDraftBase={selection.aiDraftBase}
            customerStatus={customer.status}
            dockedAgentDraft={hasAgentDraft}
            attachedInvoiceCount={attachedInvoiceCount}
            onOverlayHeightChange={setComposerPad}
          />
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
            attachedInvoiceCount={attachedInvoiceCount}
            onDraftFollowUp={scrollToDraft}
          />
        </aside>
      </div>
    </div>
  );
}
