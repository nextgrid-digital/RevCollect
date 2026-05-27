'use client';

import { Message, MessageAvatar, MessageContent } from '@/components/prompt-kit/message';
import { cn } from '@/lib/utils';
import { COLLECTIONS_AGENT } from '../../constants';
import { formatRelativeDate, getInitials } from '../../utils';
import type { Customer, ThreadMessage } from '../../types';

interface ConversationThreadProps {
  messages: ThreadMessage[];
  customer: Customer;
}

export function ConversationThread({ messages, customer }: ConversationThreadProps) {
  const customerInitials = getInitials(customer.name);

  return (
    <div className='flex flex-col gap-6'>
      {messages.map((message) => {
        const isCustomer = message.author === 'customer';
        const displayName = isCustomer ? customer.name : COLLECTIONS_AGENT.name;

        return (
          <Message
            key={message.id}
            className={cn('w-full gap-3', isCustomer ? 'justify-start' : 'justify-end')}
          >
            {isCustomer ? (
              <MessageAvatar
                src={customer.avatarUrl ?? ''}
                alt={customer.name}
                fallback={customerInitials}
              />
            ) : null}
            <div className='flex min-w-0 max-w-[85%] flex-col gap-1'>
              <div
                className={cn(
                  'flex items-center gap-2',
                  isCustomer ? 'justify-start' : 'justify-end'
                )}
              >
                <span className='text-xs font-medium'>{displayName}</span>
                <time className='text-muted-foreground shrink-0 text-xs'>
                  {formatRelativeDate(message.sentAt)}
                </time>
              </div>
              <MessageContent
                className={cn(
                  'p-3 text-sm leading-relaxed whitespace-pre-wrap break-words',
                  isCustomer ? 'bg-muted/40 border-0' : 'border-primary/20 bg-primary/5 border'
                )}
              >
                {message.body}
              </MessageContent>
            </div>
            {!isCustomer ? (
              <MessageAvatar
                src={COLLECTIONS_AGENT.src}
                alt={COLLECTIONS_AGENT.alt}
                fallback={COLLECTIONS_AGENT.fallback}
              />
            ) : null}
          </Message>
        );
      })}
    </div>
  );
}
