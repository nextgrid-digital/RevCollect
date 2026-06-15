'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { formatCurrency } from '../../utils';
import type { AgingCustomerBreakdownRow } from '../../types';
import { AgingRiskBadge } from './aging-risk-badge';

interface AgingCustomerBreakdownTableProps {
  rows: AgingCustomerBreakdownRow[];
}

function formatCentsCell(cents: number): string {
  if (cents === 0) return '—';
  return formatCurrency(cents);
}

function exportRowsToCsv(rows: AgingCustomerBreakdownRow[]): void {
  const headers = [
    'Customer',
    'Invoices',
    'Current',
    '1-30 days',
    '31-60 days',
    '60+ days',
    'Total',
    'Risk'
  ];

  const lines = rows.map((row) =>
    [
      row.company,
      row.invoiceCount,
      (row.currentCents / 100).toFixed(2),
      (row.days1to30Cents / 100).toFixed(2),
      (row.days31to60Cents / 100).toFixed(2),
      (row.days60PlusCents / 100).toFixed(2),
      (row.totalCents / 100).toFixed(2),
      row.risk
    ].join(',')
  );

  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'aging-customer-breakdown.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AgingCustomerBreakdownTable({ rows }: AgingCustomerBreakdownTableProps) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<AgingCustomerBreakdownRow>[]>(
    () => [
      {
        id: 'company',
        accessorKey: 'company',
        enableSorting: false,
        size: 160,
        header: 'Customer',
        cell: ({ row }) => (
          <span className='block max-w-[9rem] truncate font-medium sm:max-w-[12rem]'>
            {row.original.company}
          </span>
        )
      },
      {
        id: 'invoiceCount',
        accessorKey: 'invoiceCount',
        enableSorting: false,
        header: 'Invoices',
        cell: ({ row }) => (
          <span className='text-muted-foreground tabular-nums'>{row.original.invoiceCount}</span>
        )
      },
      {
        id: 'current',
        accessorKey: 'currentCents',
        enableSorting: false,
        header: 'Current',
        cell: ({ row }) => (
          <span className='tabular-nums'>{formatCentsCell(row.original.currentCents)}</span>
        )
      },
      {
        id: 'days1to30',
        accessorKey: 'days1to30Cents',
        enableSorting: false,
        header: '1–30 days',
        cell: ({ row }) => (
          <span className='tabular-nums'>{formatCentsCell(row.original.days1to30Cents)}</span>
        )
      },
      {
        id: 'days31to60',
        accessorKey: 'days31to60Cents',
        enableSorting: false,
        header: '31–60 days',
        cell: ({ row }) => (
          <span className='tabular-nums'>{formatCentsCell(row.original.days31to60Cents)}</span>
        )
      },
      {
        id: 'days60Plus',
        accessorKey: 'days60PlusCents',
        enableSorting: false,
        header: '60+ days',
        cell: ({ row }) => (
          <span className='tabular-nums'>{formatCentsCell(row.original.days60PlusCents)}</span>
        )
      },
      {
        id: 'total',
        accessorKey: 'totalCents',
        enableSorting: false,
        header: 'Total',
        cell: ({ row }) => (
          <span className='font-medium tabular-nums'>
            {formatCurrency(row.original.totalCents)}
          </span>
        )
      },
      {
        id: 'risk',
        accessorKey: 'risk',
        enableSorting: false,
        header: 'Risk',
        cell: ({ row }) => <AgingRiskBadge risk={row.original.risk} />
      }
    ],
    []
  );

  const { table } = useDataTable({
    data: rows,
    columns,
    pageCount: Math.max(1, Math.ceil(rows.length / 10)),
    pageKey: 'agingPage',
    perPageKey: 'agingPerPage',
    initialState: {
      columnPinning: { left: ['company'] }
    }
  });

  return (
    <section className='min-w-0'>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
        <div>
          <h2 className='text-sm font-semibold sm:text-base'>Customer Breakdown</h2>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            Table columns group 1–30 and 31–60 day buckets; chart above shows finer buckets.
          </p>
        </div>
        <button
          type='button'
          className='text-primary self-start text-sm font-medium hover:underline sm:self-auto'
          onClick={() => exportRowsToCsv(rows)}
        >
          Export CSV
        </button>
      </div>
      <div className='-mx-4 min-w-0 sm:mx-0'>
        <DataTable
          table={table}
          emptyMessage='No customers match the selected filters.'
          getRowAriaLabel={(row) => `View customer ${row.company}`}
          onRowClick={(row) => router.push(`/customers/${row.customerId}`)}
        />
      </div>
    </section>
  );
}
