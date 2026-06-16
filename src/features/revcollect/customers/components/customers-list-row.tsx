'use client';

import { memo, useCallback, type MouseEvent, type MouseEventHandler } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MotionPressable } from '@/features/revcollect/motion/motion-primitives';
import { formatCurrency } from '../../utils';
import type { Customer } from '../../types';
import type { CustomerRiskTier } from '../lib/classify-customer-risk-tier';
import { saveCustomersListScrollTop } from '../hooks/use-customers-list-scroll-preserve';
import { prefetchCustomer } from '../lib/prefetch-customer';
import { CustomerRiskBadge } from './customer-risk-badge';

interface CustomersListRowProps {
  customer: Customer;
  riskTier: CustomerRiskTier;
  selected: boolean;
  onSelect: () => void;
}

function CustomersListRowComponent({
  customer,
  riskTier,
  selected,
  onSelect
}: CustomersListRowProps) {
  const queryClient = useQueryClient();
  const amountIsOverdue = customer.daysOverdue > 0;

  const handlePrefetch = useCallback(() => {
    prefetchCustomer(queryClient, customer.id);
  }, [customer.id, queryClient]);

  const handleMouseDown: MouseEventHandler<HTMLButtonElement> = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleSelect = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const scrollContainer = event.currentTarget.closest('[data-customers-list-scroll]');
      if (scrollContainer instanceof HTMLElement) {
        saveCustomersListScrollTop(scrollContainer.scrollTop);
      }
      event.currentTarget.focus({ preventScroll: true });
      onSelect();
    },
    [onSelect]
  );

  return (
    <MotionPressable
      data-customer-id={customer.id}
      onMouseDown={handleMouseDown}
      onClick={handleSelect}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={cn(
        'relative flex w-full border-l-2 px-4 py-3 text-left transition-colors duration-150',
        'border-l-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      )}
    >
      {selected ? (
        <motion.span
          layoutId='customers-list-selection'
          layoutScroll
          className='border-l-sidebar-primary bg-sidebar-accent absolute inset-0 border-l-2'
          transition={{ type: 'spring', stiffness: 480, damping: 38 }}
        />
      ) : null}
      <div className='relative z-[1] min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-2'>
          <p className='min-w-0 truncate text-sm font-semibold'>{customer.company}</p>
          <span
            className={cn(
              'shrink-0 text-sm tabular-nums',
              amountIsOverdue
                ? 'font-semibold text-red-700 dark:text-red-400'
                : 'text-foreground font-medium'
            )}
          >
            {formatCurrency(customer.balanceCents)}
          </span>
        </div>
        <div className='mt-0.5 flex items-center justify-between gap-2'>
          <p className='text-sidebar-foreground/70 truncate text-sm'>{customer.name}</p>
          <CustomerRiskBadge tier={riskTier} />
        </div>
      </div>
    </MotionPressable>
  );
}

export const CustomersListRow = memo(CustomersListRowComponent);
