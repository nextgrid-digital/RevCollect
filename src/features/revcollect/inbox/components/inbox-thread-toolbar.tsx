'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AgentDraftMeta, Customer, InboxMessage } from '../../types';
import { InboxThreadHeroAction } from './inbox-thread-hero-action';

interface InboxThreadToolbarProps {
  customer: Customer;
  message: InboxMessage;
  agentDraftMeta?: AgentDraftMeta;
  contextSidebar?: ReactNode;
  className?: string;
  showSubject?: boolean;
}

export function InboxThreadToolbar({
  customer,
  message,
  agentDraftMeta,
  contextSidebar,
  className,
  showSubject = true
}: InboxThreadToolbarProps) {
  const [contextOpen, setContextOpen] = useState(false);

  useEffect(() => {
    setContextOpen(false);
  }, [message.id]);

  return (
    <div
      className={cn(
        'flex h-8 shrink-0 items-center gap-2 md:gap-4',
        showSubject ? 'justify-between' : 'justify-end',
        className
      )}
    >
      {showSubject ? (
        <h2 className='text-foreground min-w-0 flex-1 truncate text-sm font-semibold'>
          {message.subject}
        </h2>
      ) : null}

      <div className='flex shrink-0 items-center gap-2'>
        <InboxThreadHeroAction
          companyName={customer.company}
          agentDraftMeta={agentDraftMeta}
          unread={message.unread}
          className='max-w-[14rem] py-0 sm:max-w-xs'
        />

        {contextSidebar ? (
          <Sheet open={contextOpen} onOpenChange={setContextOpen}>
            <SheetTrigger asChild>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-8 shrink-0 md:hidden'
                aria-label='Open customer context'
              >
                <Icons.user className='size-3.5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-full p-0 sm:max-w-sm'>
              <SheetHeader className='sr-only'>
                <SheetTitle>{customer.name}</SheetTitle>
              </SheetHeader>
              {contextSidebar}
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </div>
  );
}
