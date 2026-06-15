'use client';

import { InboxContextSidebar } from './inbox-context-sidebar';
import { useInboxContextRail } from './inbox-context-rail-context';
import { InboxContextRailSkeleton } from './inbox-context-rail-skeleton';
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

  return (
    <InboxContextSidebar
      customer={data.customer}
      inboxContext={data.inboxContext}
      aiInsightText={data.aiInsightText}
      deepAnalysisText={data.deepAnalysisText}
    />
  );
}
