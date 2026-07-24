'use client';

import type { AuditReport } from '@/features/audit/lib';
import { formatMoney } from '@/features/audit/lib/narrative';
import { auditResultsHeader } from '@/features/audit/lib/ui-copy';

interface AuditResultsBannerProps {
  report: AuditReport;
}

export function AuditResultsBanner({ report }: AuditResultsBannerProps) {
  const copy = auditResultsHeader({
    extraCreditDays: report.headline.extraCreditDays,
    terms: Math.round(report.headline.vwAvgTerms),
    actual: Math.round(report.headline.vwAvgDaysToPay),
    cash: formatMoney(report.headline.cashLocked),
    extra: Math.round(report.headline.extraCreditDays)
  });

  return (
    <div className='mx-auto w-full max-w-[1200px] px-6 pt-6 sm:px-8 print:hidden'>
      <p className='font-audit-sans text-audit-ink audit-panel-keylime p-5 text-[15px] leading-[1.5] sm:text-[16px]'>
        {copy}
      </p>
    </div>
  );
}
