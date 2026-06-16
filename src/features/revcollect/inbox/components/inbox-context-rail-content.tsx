'use client';

import { InboxContextSidebar } from './inbox-context-sidebar';
import { useInboxContextRail } from './inbox-context-rail-context';
import { InboxContextRailSkeleton } from './inbox-context-rail-skeleton';
import { InboxThreadAttachmentProvider } from './inbox-thread-attachment-context';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';

export function InboxContextRailContent() {
  const { selectedMessageId } = useInboxContextRail();
  const { data } = useInboxSelectionData(selectedMessageId);

  if (!selectedMessageId) {
    return null;
  }

  if (!data) {
    return <InboxContextRailSkeleton />;
  }

  const hasAgentDraft = Boolean(data.agentDraftMeta);
  const initialAttachedInvoiceNumbers = hasAgentDraft ? data.openInvoiceNumbers : [];

  return (
    <InboxThreadAttachmentProvider
      resetKey={selectedMessageId}
      initialAttachedInvoiceNumbers={initialAttachedInvoiceNumbers}
    >
      <InboxContextSidebar
        customer={data.customer}
        inboxContext={data.inboxContext}
        aiInsightText={[data.aiInsightText, data.deepAnalysisText].filter(Boolean).join(' ')}
        hasAgentDraft={hasAgentDraft}
      />
    </InboxThreadAttachmentProvider>
  );
}
