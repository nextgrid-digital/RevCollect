'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { useInboxMessages } from '../../api/queries';
import { getInboxMessageIdForCustomer } from '../../lib/customer-actions';
import { formatCurrency } from '../../utils';
import type { AgingCustomerBreakdownRow } from '../../types';
import { AgingRiskBadge } from './aging-risk-badge';

const AGING_PAGE_SIZE = 10;

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
    '61-90 days',
    '90+ days',
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
      (row.days61to90Cents / 100).toFixed(2),
      (row.days90PlusCents / 100).toFixed(2),
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
  const { data: inboxMessages = [] } = useInboxMessages();

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
        id: 'days61to90',
        accessorKey: 'days61to90Cents',
        enableSorting: false,
        header: '61–90 days',
        cell: ({ row }) => (
          <span className='tabular-nums'>{formatCentsCell(row.original.days61to90Cents)}</span>
        )
      },
      {
        id: 'days90Plus',
        accessorKey: 'days90PlusCents',
        enableSorting: false,
        header: '90+ days',
        cell: ({ row }) => (
          <span className='tabular-nums'>{formatCentsCell(row.original.days90PlusCents)}</span>
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
        cell: ({ row }) => (
          <div className='flex flex-col items-start gap-1'>
            <AgingRiskBadge risk={row.original.risk} />
            {row.original.relationshipLabel ? (
              <span className='text-muted-foreground text-[10px] font-medium'>
                {row.original.relationshipLabel}
              </span>
            ) : null}
          </div>
        )
      },
      {
        id: 'nextStep',
        enableSorting: false,
        header: 'Next step',
        cell: ({ row }) => {
          const messageId = getInboxMessageIdForCustomer(row.original.customerId, inboxMessages);
          if (messageId) {
            return (
              <Button asChild size='sm' variant='outline' className='h-7 text-xs'>
                <Link href={`/inbox/${messageId}`} onClick={(event) => event.stopPropagation()}>
                  Follow up in inbox
                </Link>
              </Button>
            );
          }
          return (
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='h-7 text-xs'
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/customers/${row.original.customerId}`);
              }}
            >
              View customer
            </Button>
          );
        }
      }
    ],
    [inboxMessages, router]
  );

  const [agingPage] = useQueryState('agingPage', parseAsInteger.withDefault(1));
  const [agingPerPage] = useQueryState('agingPerPage', parseAsInteger.withDefault(AGING_PAGE_SIZE));
  const pageIndex = Math.max(0, agingPage - 1);
  const pagedRows = useMemo(() => {
    const start = pageIndex * agingPerPage;
    return rows.slice(start, start + agingPerPage);
  }, [agingPerPage, pageIndex, rows]);

  const { table } = useDataTable({
    data: pagedRows,
    columns,
    pageCount: Math.max(1, Math.ceil(rows.length / agingPerPage)),
    pageKey: 'agingPage',
    perPageKey: 'agingPerPage',
    initialState: {
      columnPinning: { left: ['company'] },
      pagination: { pageIndex: 0, pageSize: agingPerPage }
    }
  });

  return (
    <section className='min-w-0'>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
        <div>
          <h2 className='text-sm font-semibold sm:text-base'>Customer Breakdown</h2>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            Current, 1–30, 31–60, 61–90, and 90+ match the chart and the dashboard.
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
      <div className='min-w-0 overflow-x-auto'>
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
