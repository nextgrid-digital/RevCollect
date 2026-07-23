'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import type { AuditReport, PriorityItem } from '@/features/audit/lib';
import type { AuditNarrative } from '@/features/audit/lib/audit-narrative';
import { formatDays, formatMoney } from '@/features/audit/lib';
import {
  ReportHeading,
  ReportKicker,
  ReportProse,
  ReportSection
} from '@/features/audit/components/audit-report-chrome';
import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';

interface AuditPriorityTableProps {
  report: AuditReport;
  narrative: AuditNarrative;
}

export function AuditPriorityTable({ report, narrative }: AuditPriorityTableProps) {
  const rows = report.priority;

  const columns = useMemo<ColumnDef<PriorityItem>[]>(
    () => [
      {
        id: 'rank',
        accessorKey: 'rank',
        enableSorting: false,
        size: 48,
        header: '#',
        cell: ({ row }) => <span className='text-audit-muted'>{row.original.rank}</span>
      },
      {
        id: 'customer',
        accessorKey: 'customer',
        enableSorting: false,
        header: 'Customer',
        cell: ({ row }) => <span className='font-medium'>{row.original.customer}</span>
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
        header: () => <div className='text-right'>Wtd. age</div>,
        cell: ({ row }) => (
          <div className='text-right'>{formatDays(row.original.valueWeightedAge)}</div>
        )
      },
      {
        id: 'recommendedFirstMove',
        accessorKey: 'recommendedFirstMove',
        enableSorting: false,
        header: 'Recommended first move',
        cell: ({ row }) => (
          <span className='text-audit-muted text-sm'>{row.original.recommendedFirstMove}</span>
        )
      }
    ],
    []
  );

  const { table } = useDataTable({
    data: rows,
    columns,
    pageCount: 1,
    pageKey: 'auditPriorityPage',
    perPageKey: 'auditPriorityPerPage',
    getRowId: (row) => row.customer,
    initialState: {
      pagination: { pageIndex: 0, pageSize: Math.max(rows.length, 1) }
    }
  });

  return (
    <ReportSection pageBreak>
      <ReportKicker>Where the energy goes</ReportKicker>
      <ReportHeading>The ten moves that release the most cash.</ReportHeading>
      <ReportProse>{narrative.priorityIntro}</ReportProse>

      <div className='audit-table-shell'>
        <div className='audit-report-table min-w-0'>
          <DataTable table={table} hidePagination emptyMessage='No open priority customers.' />
        </div>
      </div>

      <div className='audit-panel-keylime flex flex-col gap-2 p-7'>
        <p className='font-audit-sans text-audit-ink text-[11px] font-semibold tracking-[0.08em] uppercase'>
          Why the order looks like this
        </p>
        <ReportProse>{narrative.whyOrderCopy}</ReportProse>
      </div>
    </ReportSection>
  );
}
