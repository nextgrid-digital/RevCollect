'use client';

import { useCallback } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Customer, InboxMessage } from '../../types';

interface InboxThreadToolbarProps {
  customer: Customer;
  message: InboxMessage;
  className?: string;
}

export function InboxThreadToolbar({ customer, message, className }: InboxThreadToolbarProps) {
  const firstName = customer.name.trim().split(/\s+/)[0] ?? customer.name;

  const handleCall = useCallback(() => {
    toast.message(`Calling ${firstName} (mock)`);
  }, [firstName]);

  return (
    <div
      className={cn(
        'border-border/60 flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3',
        className
      )}
    >
      <h2 className='text-foreground min-w-0 flex-1 truncate text-sm font-semibold'>
        {message.subject}
      </h2>

      <Button type='button' variant='outline' size='sm' className='shrink-0' onClick={handleCall}>
        <Icons.phone className='size-3.5' />
        Call
      </Button>
    </div>
  );
}
