'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useRecordCollectionDecision } from '../../api/queries';
import type { Customer } from '../../types';
import {
  addDaysIsoDate,
  formatPromisedDateLabel,
  parseIsoDate,
  todayIsoDate
} from '../../lib/collection-decision';
import { RelationshipPauseSheet } from '../../components/relationship-pause-sheet';

interface InboxReplyActionsProps {
  customer: Customer;
  onChaseAgain?: () => void;
  className?: string;
}

export function InboxReplyActions({ customer, onChaseAgain, className }: InboxReplyActionsProps) {
  const mutation = useRecordCollectionDecision();
  const [promisedOpen, setPromisedOpen] = useState(false);
  const pendingAction = mutation.isPending ? mutation.variables?.action : undefined;
  const isPromising = pendingAction === 'promised';
  const selectedPromisedDate = customer.promisedDate
    ? parseIsoDate(customer.promisedDate)
    : parseIsoDate(addDaysIsoDate(7));
  const promisedLabel =
    customer.status === 'promised' && customer.promisedDate
      ? `Promised · ${formatPromisedDateLabel(customer.promisedDate)}`
      : 'Promised';
  const todayStart = useMemo(() => parseIsoDate(todayIsoDate()), []);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Popover modal open={promisedOpen} onOpenChange={setPromisedOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            size='sm'
            variant={customer.status === 'promised' ? 'default' : 'outline'}
            className='rounded-full'
            disabled={mutation.isPending}
            {...(isPromising ? { isLoading: true } : {})}
            aria-label='Mark as promised to pay'
            aria-expanded={promisedOpen}
          >
            {isPromising ? null : <Icons.calendar className='size-3.5' />}
            {promisedLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='z-[200] w-auto p-0'
          align='start'
          side='top'
          sideOffset={8}
          avoidCollisions={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className='border-border border-b px-3 py-2'>
            <p className='text-sm font-medium'>Set promised date</p>
            <p className='text-muted-foreground text-xs'>Choose when they said they will pay.</p>
          </div>
          <Calendar
            mode='single'
            selected={selectedPromisedDate}
            defaultMonth={selectedPromisedDate}
            disabled={{ before: todayStart }}
            onSelect={(date) => {
              if (!date) return;
              mutation.mutate(
                {
                  customerId: customer.id,
                  action: 'promised',
                  promisedDate: addDaysIsoDate(0, date)
                },
                {
                  onSuccess: () => setPromisedOpen(false)
                }
              );
            }}
          />
        </PopoverContent>
      </Popover>

      <Button
        type='button'
        size='sm'
        variant='outline'
        className='rounded-full'
        disabled={mutation.isPending}
        isLoading={pendingAction === 'chase_again'}
        aria-label='Chase again'
        onClick={() =>
          mutation.mutate(
            {
              customerId: customer.id,
              action: 'chase_again'
            },
            {
              onSuccess: () => onChaseAgain?.()
            }
          )
        }
      >
        {pendingAction === 'chase_again' ? null : <Icons.send className='size-3.5' />}
        Chase again
      </Button>

      <RelationshipPauseSheet customer={customer} />
    </div>
  );
}
