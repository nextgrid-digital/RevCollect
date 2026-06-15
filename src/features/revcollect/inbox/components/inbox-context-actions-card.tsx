'use client';

import { useCallback } from 'react';
import type { ComponentType } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxContextActionsCardProps {
  contactName: string;
  source?: string;
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

export function InboxContextActionsCard({ contactName, source }: InboxContextActionsCardProps) {
  const firstName = getFirstName(contactName);
  const integrationLabel = source ? `View in ${source}` : 'View in QuickBooks';

  const handleCall = useCallback(() => {
    toast.message(`Calling ${firstName} (mock)`);
  }, [firstName]);

  const handleViewIntegration = useCallback(() => {
    toast.message(`Opening ${source ?? 'QuickBooks'} (mock)`);
  }, [source]);

  const handleMarkResolved = useCallback(() => {
    toast.success('Marked resolved (mock)');
  }, []);

  return (
    <InboxContextRailSection label='Actions' unstyled contentClassName='px-1'>
      <ActionRow label={`Call ${firstName}`} icon={Icons.phone} onClick={handleCall} />
      <ActionRow
        label={integrationLabel}
        icon={Icons.externalLink}
        onClick={handleViewIntegration}
      />
      <ActionRow label='Mark resolved' icon={Icons.circleCheck} onClick={handleMarkResolved} />
    </InboxContextRailSection>
  );
}
