'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { InboxPeekHeaderBar } from './inbox-peek-header-bar';
import { InboxThreadDetail } from './inbox-thread-detail';

interface InboxPeekSidePanelProps {
  messageId: string | null;
  onClose: () => void;
}

export function InboxPeekSidePanel({ messageId, onClose }: InboxPeekSidePanelProps) {
  const { data: selection } = useInboxSelectionData(messageId);

  return (
    <Sheet open={messageId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side='right'
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        className='border-border/60 flex h-full w-[min(92vw,52rem)] max-w-[min(92vw,52rem)] flex-col gap-0 overflow-hidden border-l p-0 shadow-xl sm:max-w-[min(92vw,52rem)]'
      >
        <SheetHeader className='sr-only'>
          <SheetTitle>Email thread preview</SheetTitle>
          <SheetDescription>Collection thread preview</SheetDescription>
        </SheetHeader>

        {messageId ? (
          <>
            {selection ? (
              <InboxPeekHeaderBar
                customer={selection.customer}
                subject={selection.message.subject}
                agentDraftMeta={selection.agentDraftMeta}
                unread={selection.message.unread}
                trailing={
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
                }
              />
            ) : (
              <div className='border-border/60 flex shrink-0 items-center justify-end border-b px-3 py-2'>
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
            )}
            <div className='min-h-0 flex-1 overflow-hidden'>
              <InboxThreadDetail
                messageId={messageId}
                variant='peek'
                peekLayout='side'
                onClose={onClose}
                className='h-full'
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
