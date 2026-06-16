'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CustomerAvatar } from '../../components/customer-avatar';
import type { Customer } from '../../types';

interface InboxThreadHeaderProps {
  customer: Customer;
  className?: string;
}

export function InboxThreadHeader({ customer, className }: InboxThreadHeaderProps) {
  return (
    <header className={cn('bg-background w-full min-w-0 shrink-0', className)}>
      <Link
        href={`/customers/${customer.id}`}
        className='group hover:bg-muted/40 -mx-1 flex items-center gap-3 rounded-lg px-1 py-0.5 transition-colors'
      >
        <CustomerAvatar
          name={customer.company}
          avatarUrl={customer.avatarUrl}
          className='size-9 shrink-0'
        />
        <div className='min-w-0'>
          <p className='text-foreground group-hover:underline text-sm font-semibold leading-snug underline-offset-2'>
            {customer.company}
          </p>
          <p className='text-muted-foreground mt-0.5 text-xs leading-snug'>{customer.name}</p>
        </div>
      </Link>
    </header>
  );
}
