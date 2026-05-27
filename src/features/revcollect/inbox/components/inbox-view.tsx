'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomerAvatar } from '../../components/customer-avatar';
import { StatusPill } from '../../components/status-pill';
import { AiDraftCard } from '../../components/ai-draft-card';
import { CustomerContextPanel } from '../../components/customer-context-panel';
import { formatRelativeDate } from '../../utils';
import {
  getAiDraftForMessage,
  getCustomerById,
  inboxMessages
} from '../../mock-data';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

export function InboxView() {
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState(inboxMessages[0]?.id ?? '');
  const [mobilePane, setMobilePane] = useState<'list' | 'thread'>('list');
  const [contextOpen, setContextOpen] = useState(false);

  const selectedMessage = inboxMessages.find((m) => m.id === selectedId);
  const customer = selectedMessage ? getCustomerById(selectedMessage.customerId) : undefined;

  const showList = !isMobile || mobilePane === 'list';
  const showThread = !isMobile || mobilePane === 'thread';

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border md:flex-row'>
      <div
        className={cn(
          'flex min-h-0 w-full shrink-0 flex-col border-b md:w-[22rem] md:max-w-sm md:border-r md:border-b-0',
          !showList && 'hidden md:flex'
        )}
      >
        <div className='border-b px-4 py-3'>
          <p className='text-sm font-medium'>Messages</p>
          <p className='text-muted-foreground text-xs'>
            {inboxMessages.filter((m) => m.unread).length} unread
          </p>
        </div>
        <ScrollArea className='min-h-0 flex-1'>
          <ul className='divide-y'>
            {inboxMessages.map((message) => {
              const msgCustomer = getCustomerById(message.customerId);
              if (!msgCustomer) return null;

              return (
                <li key={message.id}>
                  <button
                    type='button'
                    onClick={() => {
                      setSelectedId(message.id);
                      if (isMobile) {
                        setMobilePane('thread');
                      }
                    }}
                    className={cn(
                      'hover:bg-muted/50 flex w-full gap-3 px-4 py-3 text-left transition-colors',
                      selectedId === message.id && 'bg-muted'
                    )}
                  >
                    <CustomerAvatar name={msgCustomer.name} avatarUrl={msgCustomer.avatarUrl} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span
                          className={cn(
                            'truncate text-sm',
                            message.unread && 'font-semibold'
                          )}
                        >
                          {msgCustomer.company}
                        </span>
                        <time className='text-muted-foreground shrink-0 text-xs'>
                          {formatRelativeDate(message.receivedAt)}
                        </time>
                      </div>
                      <p className='truncate text-sm'>{message.subject}</p>
                      <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                        {message.preview}
                      </p>
                      <div className='mt-2'>
                        <StatusPill status={msgCustomer.status} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col',
          !showThread && 'hidden md:flex'
        )}
      >
        {selectedMessage && customer ? (
          <>
            <div className='flex items-center gap-2 border-b px-4 py-3 md:px-6 md:py-4'>
              {isMobile && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='md:hidden'
                  onClick={() => setMobilePane('list')}
                >
                  <Icons.chevronLeft className='size-4' />
                </Button>
              )}
              <div className='min-w-0 flex-1'>
                <h2 className='truncate text-base font-semibold md:text-lg'>
                  {selectedMessage.subject}
                </h2>
                <p className='text-muted-foreground truncate text-sm'>
                  {customer.name} · {customer.email}
                </p>
              </div>
              {customer && (
                <Sheet open={contextOpen} onOpenChange={setContextOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='shrink-0 md:hidden'
                      aria-label='Open customer context'
                    >
                      <Icons.user className='size-4' />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='right' className='w-full sm:max-w-sm'>
                    <SheetHeader>
                      <SheetTitle>{customer.name}</SheetTitle>
                    </SheetHeader>
                    <div className='mt-4'>
                      <CustomerContextPanel customer={customer} />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
            <ScrollArea className='min-h-0 flex-1'>
              <div className='space-y-6 px-4 py-4 md:px-6 md:py-6'>
                <div className='bg-muted/40 rounded-lg border p-4'>
                  <p className='text-muted-foreground mb-2 text-xs font-medium uppercase'>
                    Customer message
                  </p>
                  <p className='text-sm whitespace-pre-wrap break-words'>{selectedMessage.body}</p>
                </div>
                <AiDraftCard draft={getAiDraftForMessage(selectedMessage.id)} />
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className='text-muted-foreground flex flex-1 items-center justify-center text-sm'>
            Select a message
          </div>
        )}
      </div>

      <div className='hidden min-h-0 w-80 shrink-0 overflow-hidden border-l lg:block xl:w-96'>
        {customer ? (
          <CustomerContextPanel customer={customer} />
        ) : (
          <div className='text-muted-foreground flex h-full items-center justify-center p-4 text-sm'>
            No customer selected
          </div>
        )}
      </div>
    </div>
  );
}
