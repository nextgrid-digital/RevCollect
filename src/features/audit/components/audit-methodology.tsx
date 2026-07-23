'use client';

import type { AuditReport } from '@/features/audit/lib';
import {
  buildMethodAboutCopy,
  buildMethodBehaviorCopy,
  buildMethodCashLockedCopy,
  buildMethodDataCopy,
  buildMethodDaysCopy,
  buildMethodImpactCopy,
  buildMethodStatutoryCopy
} from '@/features/audit/lib/report-copy';
import {
  ReportCaption,
  ReportHeading,
  ReportKicker,
  ReportProse,
  ReportSection
} from '@/features/audit/components/audit-report-chrome';

interface AuditMethodologyProps {
  report: AuditReport;
  dataSource: 'sample' | 'upload';
}

export function AuditMethodology({ report, dataSource }: AuditMethodologyProps) {
  const paragraphs = [
    buildMethodDataCopy(report, dataSource),
    buildMethodDaysCopy(report),
    buildMethodCashLockedCopy(report),
    buildMethodBehaviorCopy(),
    buildMethodImpactCopy(),
    buildMethodStatutoryCopy(),
    buildMethodAboutCopy(dataSource)
  ];

  return (
    <ReportSection pageBreak>
      <div className='audit-panel-mint flex flex-col gap-6 p-7 sm:p-[42px]'>
        <ReportKicker>Method, data, and notes</ReportKicker>
        <ReportHeading>How every number was computed.</ReportHeading>
        <div className='flex max-w-3xl flex-col gap-5'>
          {paragraphs.map((text) => (
            <ReportProse key={text.slice(0, 24)}>{text}</ReportProse>
          ))}
        </div>
        <p className='font-audit-sans text-audit-ink mt-4 text-center text-[12px] tracking-[0.35em]'>
          ✦ &nbsp; ✦ &nbsp; ✦
        </p>
        <ReportCaption className='text-center'>
          RevCollect · The AI collections agent for small business · revcollect.ai
        </ReportCaption>
      </div>
    </ReportSection>
  );
}
