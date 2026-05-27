import Link from 'next/link';
import { CustomerAvatar } from '../../components/customer-avatar';
import { StatusPill } from '../../components/status-pill';
import { formatCurrency } from '../../utils';
import type { Customer } from '../../types';

interface CustomersMobileListProps {
  customers: Customer[];
}

export function CustomersMobileList({ customers }: CustomersMobileListProps) {
  if (customers.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        No customers yet.
      </p>
    );
  }

  return (
    <div className='space-y-3'>
      {customers.map((customer) => (
        <Link
          key={customer.id}
          href={`/customers/${customer.id}`}
          className='flex items-center justify-between gap-3 rounded-lg border p-3 active:bg-muted/70'
        >
          <div className='flex items-center gap-3'>
            <CustomerAvatar name={customer.name} avatarUrl={customer.avatarUrl} />
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>{customer.company}</p>
              <p className='text-muted-foreground truncate text-xs'>{customer.name}</p>
              <div className='mt-1'>
                <StatusPill status={customer.status} />
              </div>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-sm font-semibold tabular-nums'>
              {formatCurrency(customer.balanceCents)}
            </p>
            <p className='text-muted-foreground mt-1 text-xs'>
              {customer.daysOverdue > 0 ? `${customer.daysOverdue}d overdue` : 'Current'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

