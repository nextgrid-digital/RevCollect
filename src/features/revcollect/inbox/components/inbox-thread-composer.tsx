'use client';

import type { AgentDraftMeta, CollectionStatus, Customer } from '../../types';
import { InboxAgentDraftPanel } from './inbox-agent-draft-panel';
import { InboxFloatingComposer } from './inbox-floating-composer';

interface InboxThreadComposerProps {
  agentDraftMeta?: AgentDraftMeta;
  aiDraftBase: string;
  customerStatus: CollectionStatus;
  customerId: string;
  messageId?: string;
  customer?: Customer;
  autoFocus?: boolean;
}

export function InboxThreadComposer({
  agentDraftMeta,
  aiDraftBase,
  customerStatus,
  customerId,
  messageId,
  customer,
  autoFocus = false
}: InboxThreadComposerProps) {
  return (
    <div id='inbox-thread-composer'>
      {agentDraftMeta ? (
        <InboxAgentDraftPanel
          draftMeta={agentDraftMeta}
          customerId={customerId}
          messageId={messageId}
        />
      ) : (
        <InboxFloatingComposer
          draft={aiDraftBase}
          customerStatus={customerStatus}
          customerId={customerId}
          messageId={messageId}
          customer={customer}
          autoFocus={autoFocus}
        />
      )}
    </div>
  );
}
