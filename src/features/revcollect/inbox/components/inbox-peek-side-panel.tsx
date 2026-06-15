'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { InboxThreadDetail } from './inbox-thread-detail';
import { InboxThreadHeader } from './inbox-thread-header';

interface InboxPeekSidePanelProps {
  messageId: string;
  onClose: () => void;
}

export function InboxPeekSidePanel({ messageId, onClose }: InboxPeekSidePanelProps) {
  const { data: selection } = useInboxSelectionData(messageId);

  return (
    <aside
      className={cn(
        'border-border/60 bg-background fixed top-0 right-0 z-30 flex h-svh w-[min(92vw,72rem)] flex-col overflow-hidden border-l shadow-xl',
        'animate-in slide-in-from-right fade-in-0 duration-300'
      )}
    >
      <div className='border-border/60 flex shrink-0 items-center gap-3 border-b px-3 py-2'>
        <div className='min-w-0 flex-1'>
          {selection ? (
            <InboxThreadHeader
              customer={selection.customer}
              invoiceNumbers={selection.openInvoiceNumbers}
              className='py-0'
            />
          ) : null}
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-8 shrink-0'
          onClick={onClose}
          aria-label='Close'
        >
          <Icons.close className='size-4' />
        </Button>
      </div>
      <div className='min-h-0 flex-1 overflow-hidden'>
        <InboxThreadDetail
          messageId={messageId}
          variant='peek'
          hideHeader
          onClose={onClose}
          className='h-full'
        />
      </div>
    </aside>
  );
}
