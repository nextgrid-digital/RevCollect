'use client';

import type { AgentDraftMeta, CollectionStatus } from '../../types';
import { InboxAgentDraftPanel } from './inbox-agent-draft-panel';
import { InboxFloatingComposer } from './inbox-floating-composer';

interface InboxThreadComposerProps {
  agentDraftMeta?: AgentDraftMeta;
  aiDraftBase: string;
  customerStatus: CollectionStatus;
  dockedAgentDraft?: boolean;
  attachedInvoiceCount?: number;
  onOverlayHeightChange?: (height: number) => void;
}

export function InboxThreadComposer({
  agentDraftMeta,
  aiDraftBase,
  customerStatus,
  dockedAgentDraft = false,
  attachedInvoiceCount = 0,
  onOverlayHeightChange
}: InboxThreadComposerProps) {
  if (agentDraftMeta && dockedAgentDraft) {
    return (
      <InboxAgentDraftPanel
        docked
        draftMeta={agentDraftMeta}
        customerStatus={customerStatus}
        baseDraft={aiDraftBase}
        attachedInvoiceCount={attachedInvoiceCount}
      />
    );
  }

  if (agentDraftMeta) {
    return (
      <InboxAgentDraftPanel
        floating
        draftMeta={agentDraftMeta}
        customerStatus={customerStatus}
        baseDraft={aiDraftBase}
        onOverlayHeightChange={onOverlayHeightChange}
      />
    );
  }

  return (
    <InboxFloatingComposer
      draft={aiDraftBase}
      customerStatus={customerStatus}
      onOverlayHeightChange={onOverlayHeightChange}
    />
  );
}
