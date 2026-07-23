'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import type { AuditReport, CustomerBehavior } from '@/features/audit/lib';
import { formatDays, formatMoney } from '@/features/audit/lib';
import { buildWithinTermsFootnote } from '@/features/audit/lib/report-copy';
import {
  ReportHeading,
  ReportKicker,
  ReportProse,
  ReportSection
} from '@/features/audit/components/audit-report-chrome';
import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';

interface AuditDetailTablesProps {
  report: AuditReport;
}

type OverdueInvoice = AuditReport['overdueInvoices'][number];

export function AuditDetailTables({ report }: AuditDetailTablesProps) {
  const openCustomers = useMemo(
    () =>
      report.customers
        .filter((c) => c.openValue > 0)
        .toSorted((a, b) => b.impactScore - a.impactScore),
    [report.customers]
  );

  const overdueRows = useMemo(
    () => report.overdueInvoices.toSorted((a, b) => b.daysPastDue - a.daysPastDue),
    [report.overdueInvoices]
  );

  const openColumns = useMemo<ColumnDef<CustomerBehavior>[]>(
    () => [
      {
        id: 'customer',
        accessorKey: 'customer',
        enableSorting: false,
        header: 'Customer',
        cell: ({ row }) => <span className='font-medium'>{row.original.customer}</span>
      },
      {
        id: 'openInvoiceCount',
        accessorKey: 'openInvoiceCount',
        enableSorting: false,
        header: () => <div className='text-right'>Open invoices</div>,
        cell: ({ row }) => <div className='text-right'>{row.original.openInvoiceCount}</div>
      },
      {
        id: 'openValue',
        accessorKey: 'openValue',
        enableSorting: false,
        header: () => <div className='text-right'>Open value</div>,
        cell: ({ row }) => <div className='text-right'>{formatMoney(row.original.openValue)}</div>
      },
      {
        id: 'valueWeightedAge',
        accessorKey: 'valueWeightedAge',
        enableSorting: false,
        header: () => <div className='text-right'>Value-weighted age</div>,
        cell: ({ row }) => (
          <div className='text-right'>{formatDays(row.original.valueWeightedAge)}</div>
        )
      },
      {
        id: 'impactScore',
        accessorKey: 'impactScore',
        enableSorting: false,
        header: () => <div className='text-right'>Impact</div>,
        cell: ({ row }) => (
          <div className='text-right'>
            {Math.round(row.original.impactScore / 1000).toLocaleString('en-US')}K
          </div>
        )
      }
    ],
    []
  );

  const overdueColumns = useMemo<ColumnDef<OverdueInvoice>[]>(
    () => [
      {
        id: 'invoiceNumber',
        accessorKey: 'invoiceNumber',
        enableSorting: false,
        header: 'Invoice',
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.invoiceNumber}</span>
      },
      {
        id: 'customer',
        accessorKey: 'customer',
        enableSorting: false,
        header: 'Customer'
      },
      {
        id: 'issued',
        accessorKey: 'issued',
        enableSorting: false,
        header: 'Issued',
        cell: ({ row }) => (
          <span className='text-audit-muted text-xs'>
            {row.original.issued.toISOString().slice(0, 10)}
          </span>
        )
      },
      {
        id: 'due',
        accessorKey: 'due',
        enableSorting: false,
        header: 'Due',
        cell: ({ row }) => (
          <span className='text-audit-muted text-xs'>
            {row.original.due.toISOString().slice(0, 10)}
          </span>
        )
      },
      {
        id: 'amount',
        accessorKey: 'amount',
        enableSorting: false,
        header: () => <div className='text-right'>Amount</div>,
        cell: ({ row }) => <div className='text-right'>{formatMoney(row.original.amount)}</div>
      },
      {
        id: 'daysPastDue',
        accessorKey: 'daysPastDue',
        enableSorting: false,
        header: () => <div className='text-right'>Days past due</div>,
        cell: ({ row }) => <div className='text-right'>{row.original.daysPastDue}</div>
      }
    ],
    []
  );

  const { table: openTable } = useDataTable({
    data: openCustomers,
    columns: openColumns,
    pageCount: 1,
    pageKey: 'auditOpenPage',
    perPageKey: 'auditOpenPerPage',
    getRowId: (row) => row.customer,
    initialState: {
      pagination: { pageIndex: 0, pageSize: Math.max(openCustomers.length, 1) }
    }
  });

  const { table: overdueTable } = useDataTable({
    data: overdueRows,
    columns: overdueColumns,
    pageCount: 1,
    pageKey: 'auditOverduePage',
    perPageKey: 'auditOverduePerPage',
    getRowId: (row) => row.invoiceNumber,
    initialState: {
      pagination: { pageIndex: 0, pageSize: Math.max(overdueRows.length, 1) }
    }
  });

  return (
    <>
      <ReportSection pageBreak>
        <ReportKicker>The detail · for those who want the whole picture</ReportKicker>
        <ReportHeading>Open balances by customer.</ReportHeading>
        <div className='audit-table-shell'>
          <div className='audit-report-table min-w-0'>
            <DataTable table={openTable} hidePagination emptyMessage='No open balances.' />
          </div>
          <div className='font-audit-sans text-audit-ink mt-4 flex flex-wrap gap-x-8 gap-y-1 border-t border-[var(--audit-rule)] pt-4 text-[14px] font-medium'>
            <span>TOTAL</span>
            <span className='tabular-nums'>{report.headline.outstandingCount} invoices</span>
            <span className='tabular-nums'>{formatMoney(report.headline.openAr)}</span>
          </div>
        </div>
        <ReportProse>
          Value-weighted age answers &quot;how old is this customer&apos;s money,&quot; weighting
          each open invoice&apos;s age by its value, so one large old invoice reads as the problem
          it is. Impact is open value multiplied by weighted age; it is the ranking key for the
          priority list and for where follow-up energy should go.
        </ReportProse>
      </ReportSection>

      <ReportSection pageBreak>
        <ReportKicker>The detail</ReportKicker>
        <ReportHeading>Every overdue invoice, oldest first.</ReportHeading>
        <div className='audit-table-shell'>
          <div className='audit-report-table min-w-0'>
            <DataTable table={overdueTable} hidePagination emptyMessage='No overdue invoices.' />
          </div>
        </div>
        <ReportProse>{buildWithinTermsFootnote(report)}</ReportProse>
      </ReportSection>
    </>
  );
}
