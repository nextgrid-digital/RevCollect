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
import { AuditResultsBanner } from '@/features/audit/components/audit-results-banner';
import { AuditFooterCta } from '@/features/audit/components/audit-footer-cta';
import { AuditTrustFaq } from '@/features/audit/components/audit-trust-faq';
import { AuditProcessingStatus } from '@/features/audit/components/audit-processing-status';
import { Button } from '@/components/ui/button';
import { AUDIT_HERO } from '@/features/audit/lib/ui-copy';

interface AuditDashboardProps {
  report: AuditReport | null;
  narrative: AuditNarrative | null;
  dataSource: AuditDataSource;
  isPending: boolean;
  isSummarizing: boolean;
  invoiceCount: number | null;
  customerCount: number | null;
  onLoadSample: () => void;
  onUploadClick: () => void;
}

export function AuditDashboard({
  report,
  narrative,
  dataSource,
  isPending,
  isSummarizing,
  invoiceCount,
  customerCount,
  onLoadSample,
  onUploadClick
}: AuditDashboardProps) {
  if (isPending) {
    return (
      <AuditProcessingStatus
        variant='panel'
        isPending={isPending}
        isSummarizing={isSummarizing}
        invoiceCount={invoiceCount}
        customerCount={customerCount}
      />
    );
  }

  if (!report || !narrative) {
    return (
      <>
        <div className='mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-8 print:hidden'>
          <div className='audit-panel-keylime flex w-full flex-col gap-4 p-7 sm:p-[42px]'>
            <p className='font-audit-sans text-audit-muted text-[13px] leading-[1.5]'>
              {AUDIT_HERO.emptyLead}
            </p>
            <h2 className='font-audit-serif text-audit-ink text-[32px] leading-[1.3] font-normal tracking-[-0.01em] sm:text-[40px]'>
              {AUDIT_HERO.headline}
            </h2>
            <p className='font-audit-sans text-audit-charcoal max-w-2xl text-[14px] leading-[1.5] sm:text-[18px]'>
              {AUDIT_HERO.subhead}
            </p>
            <div className='flex flex-wrap gap-3 pt-2'>
              <Button
                type='button'
                className='audit-btn-forest'
                onClick={onUploadClick}
                disabled={isPending}
              >
                {AUDIT_HERO.primaryCta}
              </Button>
              <Button
                type='button'
                className='audit-btn-outline'
                onClick={onLoadSample}
                isLoading={isPending}
              >
                {AUDIT_HERO.secondaryCta}
              </Button>
            </div>
            <p className='font-audit-sans text-audit-muted text-[12px]'>{AUDIT_HERO.underCta}</p>
          </div>
        </div>
        <AuditTrustFaq />
      </>
    );
  }

  const methodSource = dataSource === 'upload' ? 'upload' : 'sample';

  return (
    <article className='audit-print-root pb-24'>
      <AuditResultsBanner report={report} />
      <AuditOverview report={report} narrative={narrative} />
      <AuditCustomersTable report={report} narrative={narrative} />
      <AuditPriorityTable report={report} narrative={narrative} />
      <AuditFix report={report} narrative={narrative} />
      <AuditDetailTables report={report} />
      <AuditMethodology report={report} dataSource={methodSource} />
      <AuditFooterCta />
      <footer className='font-audit-sans text-audit-muted mx-auto max-w-[1200px] px-6 pt-8 text-center text-[12px]'>
        RevCollect AR Collection Audit · {report.companyName}
      </footer>
    </article>
  );
}
