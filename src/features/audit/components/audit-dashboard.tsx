'use client';

import type { AuditReport } from '@/features/audit/lib';
import type { AuditNarrative } from '@/features/audit/lib/audit-narrative';
import type { AuditDataSource } from '@/features/audit/components/audit-ingest-bar';
import { AuditOverview } from '@/features/audit/components/audit-overview';
import { AuditCustomersTable } from '@/features/audit/components/audit-customers-table';
import { AuditPriorityTable } from '@/features/audit/components/audit-priority-table';
import { AuditFix } from '@/features/audit/components/audit-fix';
import { AuditDetailTables } from '@/features/audit/components/audit-detail-tables';
import { AuditMethodology } from '@/features/audit/components/audit-methodology';
import { Button } from '@/components/ui/button';

interface AuditDashboardProps {
  report: AuditReport | null;
  narrative: AuditNarrative | null;
  dataSource: AuditDataSource;
  isPending: boolean;
  isSummarizing: boolean;
  onLoadSample: () => void;
  onUploadClick: () => void;
}

export function AuditDashboard({
  report,
  narrative,
  dataSource,
  isPending,
  isSummarizing,
  onLoadSample,
  onUploadClick
}: AuditDashboardProps) {
  if (!report || !narrative) {
    return (
      <div className='mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-8 print:hidden'>
        <div className='audit-panel-keylime flex w-full flex-col gap-4 p-7 sm:p-[42px]'>
          <h2 className='font-audit-serif text-audit-ink text-[40px] leading-[1.35] font-normal tracking-[-0.01em]'>
            See how the book actually pays
          </h2>
          <p className='font-audit-sans text-audit-charcoal max-w-xl text-[14px] leading-[1.5] sm:text-[18px]'>
            Upload a CSV or Excel export, or run the sample dump to generate a full AR collection
            audit — the same report structure you can print or save as PDF.
          </p>
          <div className='flex flex-wrap gap-3 pt-2'>
            <Button
              type='button'
              className='audit-btn-forest'
              onClick={onLoadSample}
              isLoading={isPending}
            >
              Run sample dataset
            </Button>
            <Button
              type='button'
              className='audit-btn-outline'
              onClick={onUploadClick}
              disabled={isPending}
            >
              Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const methodSource = dataSource === 'upload' ? 'upload' : 'sample';

  return (
    <article className='audit-print-root pb-24'>
      {isSummarizing ? (
        <p className='font-audit-sans text-audit-muted mx-auto max-w-[1200px] px-6 pt-4 text-[12px] print:hidden'>
          Gemini is rewriting the narrative from your computed numbers…
        </p>
      ) : null}
      <AuditOverview report={report} narrative={narrative} />
      <AuditCustomersTable report={report} narrative={narrative} />
      <AuditPriorityTable report={report} narrative={narrative} />
      <AuditFix report={report} narrative={narrative} />
      <AuditDetailTables report={report} />
      <AuditMethodology report={report} dataSource={methodSource} />
      <footer className='font-audit-sans text-audit-muted mx-auto max-w-[1200px] px-6 pt-8 text-center text-[12px]'>
        RevCollect AR Collection Audit · {report.companyName}
      </footer>
    </article>
  );
}
