'use client';

import type { AuditReport } from '@/features/audit/lib';
import { formatMoney } from '@/features/audit/lib';
import {
  buildAgingNinetyCallout,
  buildCoverClosing,
  buildCoverTeaser,
  buildInterestCopy,
  buildInterestHeadline,
  buildPage1Intro,
  buildTermsGapCopy,
  buildTermsRealityTitle,
  formatPreparedDate
} from '@/features/audit/lib/report-copy';
import {
  ReportCaption,
  ReportHeading,
  ReportKicker,
  ReportProse,
  ReportSection
} from '@/features/audit/components/audit-report-chrome';

interface AuditOverviewProps {
  report: AuditReport;
}

export function AuditOverview({ report }: AuditOverviewProps) {
  const { headline } = report;
  const stated = Math.round(headline.vwAvgTerms);
  const reality = Math.round(headline.vwAvgDaysToPay);

  const agingEntries: Array<[keyof typeof headline.aging, string]> = [
    ['Current', 'Current'],
    ['1-30', '1–30 late'],
    ['31-60', '31–60'],
    ['61-90', '61–90'],
    ['90+', '90+']
  ];

  return (
    <>
      <ReportSection>
        <div className='audit-panel-keylime flex flex-col gap-6 p-7 sm:p-[42px]'>
          <div className='flex flex-col gap-3'>
            <ReportKicker>RevCollect AR Collection Audit</ReportKicker>
            <ReportCaption>Prepared {formatPreparedDate(report.analysisDate)}</ReportCaption>
            <p className='font-audit-sans text-audit-ink text-[11px] font-semibold tracking-[0.08em] uppercase'>
              Prepared for {report.companyName}
            </p>
          </div>

          <ReportHeading as='h1' className='max-w-2xl'>
            Where your money actually lies.
          </ReportHeading>

          <ReportProse>{buildPage1Intro(report)}</ReportProse>

          <div className='grid gap-7 border-y border-[var(--audit-rule)] py-7 sm:grid-cols-3'>
            <Figure
              value={formatMoney(headline.openAr)}
              caption={`Open receivables today, across ${headline.outstandingCount} invoices and ${headline.openCustomerCount} customers`}
            />
            <Figure
              value={formatMoney(headline.averageMonthlyBilling)}
              caption='Your average monthly billing over the analyzed period'
            />
            <Figure
              value={formatMoney(headline.cashLocked)}
              caption='Cash permanently parked with customers because of slow collection'
            />
          </div>

          <ReportProse>{buildCoverClosing(report)}</ReportProse>
          <ReportProse>{buildCoverTeaser()}</ReportProse>
        </div>
      </ReportSection>

      <ReportSection pageBreak>
        <ReportKicker>How you actually collect</ReportKicker>
        <ReportHeading>{buildTermsRealityTitle(report)}</ReportHeading>
        <div className='grid gap-7 sm:grid-cols-2'>
          <div className='audit-panel-mint px-7 py-7'>
            <p className='font-audit-sans text-audit-ink text-[11px] font-semibold tracking-[0.08em] uppercase'>
              Your stated terms
            </p>
            <p className='font-audit-serif text-audit-ink mt-3 text-5xl font-normal tabular-nums'>
              {stated} days
            </p>
          </div>
          <div className='audit-panel-mint px-7 py-7'>
            <p className='font-audit-sans text-audit-ink text-[11px] font-semibold tracking-[0.08em] uppercase'>
              How you get paid
            </p>
            <p className='font-audit-serif text-audit-ink mt-3 text-5xl font-normal tabular-nums'>
              {reality} days
            </p>
          </div>
        </div>
        <ReportProse>{buildTermsGapCopy(report)}</ReportProse>

        <div className='mt-4 flex flex-col gap-6'>
          <ReportKicker>Where the open {formatMoney(headline.openAr)} sits today</ReportKicker>
          <div className='audit-panel-keylime flex max-w-xl flex-col divide-y divide-[var(--audit-rule)] px-7'>
            {agingEntries.map(([key, label]) => (
              <div key={key} className='flex items-baseline justify-between gap-6 py-4'>
                <span className='font-audit-sans text-audit-charcoal text-[18px]'>{label}</span>
                <span className='font-audit-serif text-audit-ink text-[23px] font-normal tabular-nums'>
                  {formatMoney(headline.aging[key])}
                </span>
              </div>
            ))}
          </div>
          <ReportProse>{buildAgingNinetyCallout(report)}</ReportProse>
          <div className='audit-panel-sage flex flex-col gap-3 p-7 sm:p-[42px]'>
            <p className='font-audit-serif text-audit-ink text-[23px] leading-snug font-normal sm:text-[28px]'>
              {buildInterestHeadline(report)}
            </p>
            <ReportProse>{buildInterestCopy(report)}</ReportProse>
          </div>
        </div>
      </ReportSection>
    </>
  );
}

function Figure({ value, caption }: { value: string; caption: string }) {
  return (
    <div className='flex flex-col gap-3'>
      <p className='font-audit-serif text-audit-ink text-3xl font-normal tracking-tight tabular-nums sm:text-4xl'>
        {value}
      </p>
      <p className='font-audit-sans text-audit-charcoal text-[14px] leading-relaxed'>{caption}</p>
    </div>
  );
}
