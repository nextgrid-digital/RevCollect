'use client';

import { useCallback } from 'react';
import type { ComponentType } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxContextActionsCardProps {
  contactName: string;
  attachedInvoiceCount?: number;
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function ActionRow({
  label,
  icon: Icon,
  onClick,
  className
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'text-foreground hover:bg-muted/50 -mx-1 flex w-full items-center gap-2 rounded-md px-1 py-2 text-left text-sm transition-colors',
        className
      )}
    >
      <Icon className='text-muted-foreground size-4 shrink-0' aria-hidden />
      <span>{label}</span>
    </button>
  );
}

export function InboxContextActionsCard({
  contactName,
  attachedInvoiceCount = 0
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

  const handleSnooze = useCallback(() => {
    toast.message('Snoozed for 3 days (mock)');
  }, []);

  return (
    <InboxContextRailSection label='Quick actions' unstyled contentClassName='px-1'>
      {attachedInvoiceCount > 0 ? (
        <ActionRow
          label={`Attach all ${attachedInvoiceCount} invoices & follow up`}
          icon={Icons.paperclip}
          onClick={handleAttachFollowUp}
        />
      ) : null}
      <ActionRow label={`Call ${firstName}`} icon={Icons.phone} onClick={handleCall} />
      <ActionRow label='Snooze 3 days' icon={Icons.clock} onClick={handleSnooze} />
    </InboxContextRailSection>
  );
}
