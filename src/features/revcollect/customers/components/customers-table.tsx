'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { useDataTable } from '@/hooks/use-data-table';
import { CustomerAvatar } from '../../components/customer-avatar';
import { StatusPill } from '../../components/status-pill';
import { formatCurrency } from '../../utils';
import { customers } from '../../mock-data';
import type { Customer } from '../../types';

const columns: ColumnDef<Customer>[] = [
  {
    id: 'customer',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
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
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ row }) => <StatusPill status={row.original.status} />
  },
  {
    id: 'balance',
    accessorKey: 'balanceCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Balance' />,
    cell: ({ row }) => (
      <span className='tabular-nums'>{formatCurrency(row.original.balanceCents)}</span>
    )
  },
  {
    id: 'daysOverdue',
    accessorKey: 'daysOverdue',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Days overdue' />,
    cell: ({ row }) => (
      <span className={row.original.daysOverdue > 0 ? 'text-destructive font-medium' : ''}>
        {row.original.daysOverdue > 0 ? row.original.daysOverdue : '—'}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button asChild size='sm' variant='outline'>
        <Link href={`/customers/${row.original.id}`}>View</Link>
      </Button>
    )
  }
];

export function CustomersTable() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const pageCount = Math.max(1, Math.ceil(customers.length / perPage));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return customers.slice(start, start + perPage);
  }, [page, perPage]);

  const { table } = useDataTable({
    data: paginatedData,
    columns,
    pageCount,
    shallow: true
  });

  return <DataTable table={table} />;
}
