'use client';

import type { AgentDraftMeta, CollectionStatus } from '../../types';
import { InboxAgentDraftPanel } from './inbox-agent-draft-panel';
import { InboxFloatingComposer } from './inbox-floating-composer';

interface InboxThreadComposerProps {
  agentDraftMeta?: AgentDraftMeta;
  aiDraftBase: string;
  customerStatus: CollectionStatus;
  customerId: string;
  autoFocus?: boolean;
}

export function InboxThreadComposer({
  agentDraftMeta,
  aiDraftBase,
  customerStatus,
  customerId,
  autoFocus = false
}: InboxThreadComposerProps) {
  if (agentDraftMeta) {
    return <InboxAgentDraftPanel draftMeta={agentDraftMeta} customerId={customerId} />;
  }

  return (
    <InboxFloatingComposer
      draft={aiDraftBase}
      customerStatus={customerStatus}
      customerId={customerId}
      autoFocus={autoFocus}
    />
  );
}
