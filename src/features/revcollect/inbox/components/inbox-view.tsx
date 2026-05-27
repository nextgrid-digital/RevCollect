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

export function InboxView() {
  const [selectedId, setSelectedId] = useState(inboxMessages[0]?.id ?? '');

  const selectedMessage = inboxMessages.find((m) => m.id === selectedId);
  const customer = selectedMessage ? getCustomerById(selectedMessage.customerId) : undefined;

  return (
    <div className='flex min-h-[calc(100vh-var(--header-height)-6rem)] flex-1 overflow-hidden rounded-lg border'>
      <div className='flex w-full max-w-xs shrink-0 flex-col border-r md:max-w-sm'>
        <div className='border-b px-4 py-3'>
          <p className='text-sm font-medium'>Messages</p>
          <p className='text-muted-foreground text-xs'>
            {inboxMessages.filter((m) => m.unread).length} unread
          </p>
        </div>
        <ScrollArea className='flex-1'>
          <ul className='divide-y'>
            {inboxMessages.map((message) => {
              const msgCustomer = getCustomerById(message.customerId);
              if (!msgCustomer) return null;

              return (
                <li key={message.id}>
                  <button
                    type='button'
                    onClick={() => setSelectedId(message.id)}
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

      <div className='flex min-w-0 flex-1 flex-col'>
        {selectedMessage && customer ? (
          <>
            <div className='border-b px-6 py-4'>
              <h2 className='text-lg font-semibold'>{selectedMessage.subject}</h2>
              <p className='text-muted-foreground text-sm'>
                {customer.name} · {customer.email}
              </p>
            </div>
            <ScrollArea className='flex-1'>
              <div className='space-y-6 p-6'>
                <div className='bg-muted/40 rounded-lg border p-4'>
                  <p className='text-muted-foreground mb-2 text-xs font-medium uppercase'>
                    Customer message
                  </p>
                  <p className='text-sm whitespace-pre-wrap'>{selectedMessage.body}</p>
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

      <div className='hidden w-80 shrink-0 border-l lg:block xl:w-96'>
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
