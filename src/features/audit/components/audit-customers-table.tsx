'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import type { AuditReport, CustomerBehavior } from '@/features/audit/lib';
import { formatDays, formatMoney, formatTrend } from '@/features/audit/lib';
import {
  buildCreditDonorsCopy,
  buildModelPayersCopy,
  buildOneToWatchCopy,
  termsLabel
} from '@/features/audit/lib/report-copy';
import {
  ReportHeading,
  ReportKicker,
  ReportProse,
  ReportSection
} from '@/features/audit/components/audit-report-chrome';
import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';

interface AuditCustomersTableProps {
  report: AuditReport;
}

export function AuditCustomersTable({ report }: AuditCustomersTableProps) {
  const rows = useMemo(
    () => report.customers.toSorted((a, b) => b.lifetimeBilled - a.lifetimeBilled),
    [report.customers]
  );

  const columns = useMemo<ColumnDef<CustomerBehavior>[]>(
    () => [
      {
        id: 'customer',
        accessorKey: 'customer',
        enableSorting: false,
        header: 'Customer',
        cell: ({ row }) => <span className='font-medium'>{row.original.customer}</span>
      },
      {
        id: 'invoiceCount',
        accessorKey: 'invoiceCount',
        enableSorting: false,
        header: () => <div className='text-right'>Invoices</div>,
        cell: ({ row }) => <div className='text-right'>{row.original.invoiceCount}</div>
      },
      {
        id: 'lifetimeBilled',
        accessorKey: 'lifetimeBilled',
        enableSorting: false,
        header: () => <div className='text-right'>Billed</div>,
        cell: ({ row }) => (
          <div className='text-right'>{formatMoney(row.original.lifetimeBilled)}</div>
        )
      },
      {
        id: 'avgDaysToPay',
        accessorKey: 'avgDaysToPay',
        enableSorting: false,
        header: () => <div className='text-right'>Avg pays at</div>,
        cell: ({ row }) => <div className='text-right'>{formatDays(row.original.avgDaysToPay)}</div>
      },
      {
        id: 'termsDays',
        accessorKey: 'termsDays',
        enableSorting: false,
        header: 'Terms',
        cell: ({ row }) => termsLabel(row.original.termsDays)
      },
      {
        id: 'avgDaysLate',
        accessorKey: 'avgDaysLate',
        enableSorting: false,
        header: () => <div className='text-right'>Avg late</div>,
        cell: ({ row }) => <div className='text-right'>{formatDays(row.original.avgDaysLate)}</div>
      },
      {
        id: 'lateTrendDays',
        accessorKey: 'lateTrendDays',
        enableSorting: false,
        header: () => <div className='text-right'>Trend</div>,
        cell: ({ row }) => (
          <div className='text-right'>{formatTrend(row.original.lateTrendDays)}</div>
        )
      },
      {
        id: 'behaviorRead',
        accessorKey: 'behaviorRead',
        enableSorting: false,
        header: 'Read',
        cell: ({ row }) => (
          <span className='text-audit-muted text-xs'>{row.original.behaviorRead}</span>
        )
      }
    ],
    []
  );

  const { table } = useDataTable({
    data: rows,
    columns,
    pageCount: 1,
    pageKey: 'auditCustomersPage',
    perPageKey: 'auditCustomersPerPage',
    getRowId: (row) => row.customer,
    initialState: {
      pagination: { pageIndex: 0, pageSize: Math.max(rows.length, 1) }
    }
  });

  return (
    <ReportSection pageBreak>
      <ReportKicker>Your customers, by behavior</ReportKicker>
      <ReportHeading>Who pays, who drags, and who is changing.</ReportHeading>

      <div className='grid gap-[21px] md:grid-cols-3'>
        <InsightColumn title='Your model payers' body={buildModelPayersCopy(report)} />
        <InsightColumn title='Your credit donors' body={buildCreditDonorsCopy(report)} />
        <InsightColumn title='The one to watch' body={buildOneToWatchCopy(report)} />
      </div>

      <div className='audit-table-shell'>
        <div className='audit-report-table min-w-0'>
          <DataTable table={table} hidePagination emptyMessage='No customers in this report.' />
        </div>
      </div>
      <ReportProse>
        Trend: average lateness of the customer&apos;s recent invoices versus their earlier ones, in
        days. Positive means slowing down. Full methodology at the end of this report.
      </ReportProse>
    </ReportSection>
  );
}

function InsightColumn({ title, body }: { title: string; body: string }) {
  return (
    <div className='audit-panel-keylime flex flex-col gap-2 p-7'>
      <p className='font-audit-sans text-audit-ink text-[11px] font-semibold tracking-[0.08em] uppercase'>
        {title}
      </p>
      <p className='font-audit-sans text-audit-charcoal text-[14px] leading-relaxed'>{body}</p>
    </div>
  );
}
