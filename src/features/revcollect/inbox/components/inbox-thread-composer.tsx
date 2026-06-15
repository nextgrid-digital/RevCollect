'use client';

import type { AgentDraftMeta, CollectionStatus } from '../../types';
import { InboxAgentDraftPanel } from './inbox-agent-draft-panel';
import { InboxFloatingComposer } from './inbox-floating-composer';

interface InboxThreadComposerProps {
  agentDraftMeta?: AgentDraftMeta;
  aiDraftBase: string;
  customerStatus: CollectionStatus;
  onOverlayHeightChange?: (height: number) => void;
}

export function InboxThreadComposer({
  agentDraftMeta,
  aiDraftBase,
  customerStatus,
  onOverlayHeightChange
}: InboxThreadComposerProps) {
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
