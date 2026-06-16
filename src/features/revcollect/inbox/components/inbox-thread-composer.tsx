'use client';

import type { AgentDraftMeta, CollectionStatus } from '../../types';
import { InboxAgentDraftPanel } from './inbox-agent-draft-panel';
import { InboxFloatingComposer } from './inbox-floating-composer';

interface InboxThreadComposerProps {
  agentDraftMeta?: AgentDraftMeta;
  aiDraftBase: string;
  customerStatus: CollectionStatus;
}

export function InboxThreadComposer({
  agentDraftMeta,
  aiDraftBase,
  customerStatus
}: InboxThreadComposerProps) {
  if (agentDraftMeta) {
    return <InboxAgentDraftPanel draftMeta={agentDraftMeta} />;
  }

  return <InboxFloatingComposer draft={aiDraftBase} customerStatus={customerStatus} />;
}
