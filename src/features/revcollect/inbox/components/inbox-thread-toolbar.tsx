'use client';

import { useCallback } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrencyWhole } from '../../utils';
import type { Customer, InboxMessage } from '../../types';

interface InboxThreadToolbarProps {
  customer: Customer;
  message: InboxMessage;
  invoiceNumbers: string[];
  onReply: () => void;
  className?: string;
}

export function InboxThreadToolbar({
  customer,
  message,
  invoiceNumbers,
  onReply,
  className
}: InboxThreadToolbarProps) {
  const firstName = customer.name.trim().split(/\s+/)[0] ?? customer.name;
  const invoiceLine = invoiceNumbers.length > 0 ? invoiceNumbers.join(', ') : null;

  const handleCall = useCallback(() => {
    toast.message(`Calling ${firstName} (mock)`);
  }, [firstName]);

  return (
    <div
      className={cn(
        'border-border/60 flex shrink-0 items-start justify-between gap-4 border-b px-4 py-3',
        className
      )}
    >
      <div className='min-w-0 flex-1'>
        <h2 className='text-foreground truncate text-sm font-semibold'>
          {customer.company} — {message.subject}
        </h2>
        <p className='text-muted-foreground mt-0.5 truncate text-xs'>
          {customer.name}
          {invoiceLine ? ` · ${invoiceLine}` : ''}
          {' · '}
          {formatCurrencyWhole(customer.balanceCents)} outstanding
        </p>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <Button type='button' variant='outline' size='sm' onClick={handleCall}>
          <Icons.phone className='size-3.5' />
          Call
        </Button>
        <Button type='button' size='sm' onClick={onReply}>
          Reply
        </Button>
      </div>
    </div>
  );
}
