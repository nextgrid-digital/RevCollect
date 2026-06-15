'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { AgingReportFilters, AgingReportPeriod, AgingReportSort, Customer } from '../../types';

interface AgingToolbarProps {
  customers: Customer[];
  filters: AgingReportFilters;
  onFiltersChange: (filters: AgingReportFilters) => void;
}

export function AgingToolbar({ customers, filters, onFiltersChange }: AgingToolbarProps) {
  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end'>
      <Select
        value={filters.customerId ?? 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            customerId: value === 'all' ? undefined : value
          })
        }
      >
        <SelectTrigger className='h-9 w-full min-w-0 sm:h-8 sm:w-[10.5rem]'>
          <SelectValue placeholder='All customers' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All customers</SelectItem>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.company}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.period}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, period: value as AgingReportPeriod })
        }
      >
        <SelectTrigger className='h-9 w-full min-w-0 sm:h-8 sm:w-[9rem]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='this_month'>This month</SelectItem>
          <SelectItem value='last_month'>Last month</SelectItem>
          <SelectItem value='all_time'>All time</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(value) => onFiltersChange({ ...filters, sort: value as AgingReportSort })}
      >
        <SelectTrigger className='h-9 w-full min-w-0 sm:h-8 sm:w-[11.5rem]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='amount_desc'>Sort: Amount (high to low)</SelectItem>
          <SelectItem value='amount_asc'>Sort: Amount (low to high)</SelectItem>
          <SelectItem value='customer_asc'>Sort: Customer (A–Z)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
