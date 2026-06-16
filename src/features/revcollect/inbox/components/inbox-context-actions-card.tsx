'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { SuggestedAction } from '../../components/suggested-action';

interface InboxContextActionsCardProps {
  contactName: string;
  attachedInvoiceCount?: number;
  hasAgentDraft?: boolean;
  heroActionPresent?: boolean;
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function InboxContextActionsCard({
  contactName,
  attachedInvoiceCount = 0,
  hasAgentDraft = false,
  heroActionPresent = false
}: InboxContextActionsCardProps) {
  const firstName = getFirstName(contactName);

  const handleAttachFollowUp = useCallback(() => {
    toast.message(
      attachedInvoiceCount > 0
        ? `Attaching ${attachedInvoiceCount} invoices and drafting follow-up (mock)`
        : 'Drafting follow-up (mock)'
    );
  }, [attachedInvoiceCount]);

  const handleCall = useCallback(() => {
    toast.message(`Calling ${firstName} (mock)`);
  }, [firstName]);

  const suggestion = useMemo(() => {
    if (heroActionPresent) {
      return {
        description: `Reach ${firstName} about outstanding balance`,
        actionLabel: `Call ${firstName}`,
        onAction: handleCall
      };
    }

    if (hasAgentDraft) {
      return null;
    }

    if (attachedInvoiceCount > 0) {
      return {
        description: `Attach ${attachedInvoiceCount} open ${attachedInvoiceCount === 1 ? 'invoice' : 'invoices'} and send a follow-up`,
        actionLabel: 'Attach & follow up',
        onAction: handleAttachFollowUp
      };
    }

    return {
      description: `Reach ${firstName} about outstanding balance`,
      actionLabel: `Call ${firstName}`,
      onAction: handleCall
    };
  }, [
    attachedInvoiceCount,
    firstName,
    handleAttachFollowUp,
    handleCall,
    hasAgentDraft,
    heroActionPresent
  ]);

  if (!suggestion) {
    return null;
  }

  return (
    <div className='px-1'>
      <SuggestedAction
        compact
        label='Suggested action'
        description={suggestion.description}
        actionLabel={suggestion.actionLabel}
        onAction={suggestion.onAction}
      />
    </div>
  );
}
