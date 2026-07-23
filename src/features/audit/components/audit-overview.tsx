'use client';

import type { AuditReport } from '@/features/audit/lib';
import type { AuditNarrative } from '@/features/audit/lib/audit-narrative';
import { formatMoney } from '@/features/audit/lib';
import { buildTermsRealityTitle, formatPreparedDate } from '@/features/audit/lib/report-copy';
import {
  ReportCaption,
  ReportHeading,
  ReportKicker,
  ReportProse,
  ReportSection
} from '@/features/audit/components/audit-report-chrome';

interface AuditOverviewProps {
  report: AuditReport;
  narrative: AuditNarrative;
}

export function AuditOverview({ report, narrative }: AuditOverviewProps) {
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

          <ReportProse>{narrative.page1Intro}</ReportProse>

          <div className='grid gap-[21px] py-2 sm:grid-cols-3'>
            <Figure
              label='Open receivables'
              value={formatMoney(headline.openAr)}
              caption={`Across ${headline.outstandingCount} invoices and ${headline.openCustomerCount} customers`}
            />
            <Figure
              label='Avg monthly billing'
              value={formatMoney(headline.averageMonthlyBilling)}
              caption='Over the analyzed billing period'
            />
            <Figure
              label='Cash locked'
              value={formatMoney(headline.cashLocked)}
              caption='Permanently parked with customers from slow collection'
            />
          </div>

          <ReportProse>{narrative.coverClosing}</ReportProse>
          <ReportProse>{narrative.coverTeaser}</ReportProse>
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
        <ReportProse>{narrative.termsGapCopy}</ReportProse>

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
          <ReportProse>{narrative.agingNinetyCallout}</ReportProse>
          <div className='audit-panel-sage flex flex-col gap-3 p-7 sm:p-[42px]'>
            <p className='font-audit-serif text-audit-ink text-[23px] leading-snug font-normal sm:text-[28px]'>
              {narrative.interestHeadline}
            </p>
            <ReportProse>{narrative.interestCopy}</ReportProse>
          </div>
        </div>
      </ReportSection>
    </>
  );
}

function Figure({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className='audit-panel-cream flex flex-col gap-3 p-7 shadow-none'>
      <p className='font-audit-sans text-audit-ink text-[11px] font-semibold tracking-[0.08em] uppercase'>
        {label}
      </p>
      <p className='font-audit-serif text-audit-ink text-3xl font-normal tracking-tight tabular-nums sm:text-4xl'>
        {value}
      </p>
      <p className='font-audit-sans text-audit-charcoal text-[14px] leading-relaxed'>{caption}</p>
    </div>
  );
}
