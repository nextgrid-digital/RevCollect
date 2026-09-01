'use client';

import type { AgentDraftMeta, CollectionStatus, Customer } from '../../types';
import { InboxAgentDraftPanel } from './inbox-agent-draft-panel';
import { InboxFloatingComposer } from './inbox-floating-composer';

interface InboxThreadComposerProps {
  agentDraftMeta?: AgentDraftMeta;
  aiDraftBase: string;
  customerStatus: CollectionStatus;
  customerId: string;
  customer?: Customer;
  autoFocus?: boolean;
}

export function InboxThreadComposer({
  agentDraftMeta,
  aiDraftBase,
  customerStatus,
  customerId,
  customer,
  autoFocus = false
}: InboxThreadComposerProps) {
  return (
    <div id='inbox-thread-composer'>
      {agentDraftMeta ? (
        <InboxAgentDraftPanel draftMeta={agentDraftMeta} customerId={customerId} />
      ) : (
        <InboxFloatingComposer
          draft={aiDraftBase}
          customerStatus={customerStatus}
          customerId={customerId}
          customer={customer}
          autoFocus={autoFocus}
        />
      )}
    </div>
  );
}
