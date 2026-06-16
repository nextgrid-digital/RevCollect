'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '../../utils';
import type { Customer } from '../../types';
import type { CustomerRiskTier } from '../lib/classify-customer-risk-tier';
import { CustomerRiskBadge } from './customer-risk-badge';

interface CustomersListRowProps {
  customer: Customer;
  riskTier: CustomerRiskTier;
  selected: boolean;
  onSelect: () => void;
}

export function CustomersListRow({
  customer,
  riskTier,
  selected,
  onSelect
}: CustomersListRowProps) {
  const amountIsOverdue = customer.daysOverdue > 0;

  return (
    <li>
      <button
        type='button'
        onClick={onSelect}
        className={cn(
          'flex w-full border-l-2 px-4 py-3 text-left transition-colors',
          selected
            ? 'border-l-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent'
            : 'hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground border-l-transparent'
        )}
      >
        <div className='min-w-0 flex-1'>
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
      </button>
    </li>
  );
}
