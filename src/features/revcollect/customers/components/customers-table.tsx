'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useDataTable } from '@/hooks/use-data-table';
import { CustomerAvatar } from '../../components/customer-avatar';
import { StatusPill } from '../../components/status-pill';
import { formatCurrency } from '../../utils';
import { useCustomers } from '../../api/queries';
import type { CollectionStatus, Customer } from '../../types';
import { CustomersStatusFilter } from './customers-status-filter';

function matchesCustomerSearch(customer: Customer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    customer.name.toLowerCase().includes(q) ||
    customer.company.toLowerCase().includes(q) ||
    customer.email.toLowerCase().includes(q)
  );
}

function matchesCustomerStatus(customer: Customer, statusFilters: CollectionStatus[]): boolean {
  if (statusFilters.length === 0) return true;
  return statusFilters.includes(customer.status);
}

const columns: ColumnDef<Customer>[] = [
  {
    id: 'customer',
    accessorKey: 'name',
    enableSorting: false,
    header: 'Customer',
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <CustomerAvatar name={row.original.name} avatarUrl={row.original.avatarUrl} />
        <div>
          <p className='font-medium'>{row.original.name}</p>
          <p className='text-muted-foreground text-sm'>{row.original.company}</p>
        </div>
      </div>
    )
  },
  {
    id: 'email',
    accessorKey: 'email',
    enableSorting: false,
    header: 'Email',
    cell: ({ row }) => (
      <span className='text-muted-foreground block max-w-[12rem] truncate sm:max-w-xs'>
        {row.original.email}
      </span>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    enableSorting: false,
    header: 'Status',
    cell: ({ row }) => <StatusPill status={row.original.status} />
  },
  {
    id: 'balance',
    accessorKey: 'balanceCents',
    enableSorting: false,
    header: 'Balance',
    cell: ({ row }) => (
      <span className='font-medium tabular-nums'>{formatCurrency(row.original.balanceCents)}</span>
    )
  },
  {
    id: 'daysOverdue',
    accessorKey: 'daysOverdue',
    enableSorting: false,
    header: 'Days overdue',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm tabular-nums'>
        {row.original.daysOverdue > 0 ? `${row.original.daysOverdue}d overdue` : 'Current'}
      </span>
    )
  }
];

export function CustomersTable() {
  const router = useRouter();
  const { data: customers = [], isPending } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<CollectionStatus[]>([]);
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          matchesCustomerSearch(customer, searchQuery) &&
          matchesCustomerStatus(customer, statusFilters)
      ),
    [customers, searchQuery, statusFilters]
  );

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredCustomers.length / perPage)),
    [filteredCustomers.length, perPage]
  );

  const { table } = useDataTable({
    data: filteredCustomers,
    columns,
    pageCount,
    shallow: true,
    enableSorting: false,
    initialState: {
      pagination: { pageIndex: page - 1, pageSize: perPage }
    }
  });

  if (isPending) {
    return <p className='text-muted-foreground text-sm'>Loading customers…</p>;
  }

  return (
    <DataTable table={table} onRowClick={(customer) => router.push(`/customers/${customer.id}`)}>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-0 flex-1 sm:max-w-sm'>
          <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            type='search'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              void setPage(1);
            }}
            placeholder='Search customers...'
            className='h-9 pl-9'
          />
        </div>
        <CustomersStatusFilter
          selectedStatuses={statusFilters}
          onSelectedStatusesChange={(statuses) => {
            setStatusFilters(statuses);
            void setPage(1);
          }}
        />
      </div>
    </DataTable>
  );
}
