'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { StatusPill } from './status-pill';
import { formatCurrency, formatDate } from '../utils';
import { useCustomers } from '../api/queries';
import type { Invoice } from '../types';

interface InvoicesTableProps {
  invoices: Invoice[];
  showCustomer?: boolean;
}

export function InvoicesTable({ invoices, showCustomer = false }: InvoicesTableProps) {
  const { data: customers = [] } = useCustomers();
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const customerCompanyById = useMemo(
    () => Object.fromEntries(customers.map((customer) => [customer.id, customer.company])),
    [customers]
  );

  const columns = useMemo(() => {
    const cols: ColumnDef<Invoice>[] = [
      {
        id: 'number',
        accessorKey: 'number',
        enableSorting: false,
        header: 'Invoice',
        cell: ({ row }) => <span className='font-medium'>{row.original.number}</span>
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: 'Status',
        cell: ({ row }) => <StatusPill status={row.original.status} />
      }
    ];

    if (showCustomer) {
      cols.push({
        id: 'customer',
        accessorKey: 'customerId',
        enableSorting: false,
        header: 'Customer',
        cell: ({ row }) => {
          const company = customerCompanyById[row.original.customerId];
          if (!company) return null;

          return (
            <Link
              href={`/customers/${row.original.customerId}`}
              className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
            >
              {company}
            </Link>
          );
        }
      });
    }

    cols.push(
      {
        id: 'dueDate',
        accessorKey: 'dueDate',
        enableSorting: false,
        header: 'Due date',
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>{formatDate(row.original.dueDate)}</span>
        )
      },
      {
        id: 'amount',
        accessorKey: 'amountCents',
        enableSorting: false,
        header: () => <span className='block text-right'>Amount</span>,
        cell: ({ row }) => (
          <span className='block text-right text-sm font-semibold tabular-nums'>
            {formatCurrency(row.original.amountCents)}
          </span>
        )
      }
    );

    return cols;
  }, [showCustomer, customerCompanyById]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(invoices.length / perPage)),
    [invoices.length, perPage]
  );

  const { table } = useDataTable({
    data: invoices,
    columns,
    pageCount,
    shallow: true,
    enableSorting: false,
    initialState: {
      pagination: { pageIndex: page - 1, pageSize: perPage }
    }
  });

  return <DataTable table={table} />;
}
