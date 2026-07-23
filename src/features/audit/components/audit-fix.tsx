'use client';

import type { AuditReport } from '@/features/audit/lib';
import type { AuditNarrative } from '@/features/audit/lib/audit-narrative';
import { FIX_HABITS } from '@/features/audit/lib/report-copy';
import {
  ReportHeading,
  ReportKicker,
  ReportProse,
  ReportSection
} from '@/features/audit/components/audit-report-chrome';

interface AuditFixProps {
  report: AuditReport;
  narrative: AuditNarrative;
}

export function AuditFix({ narrative }: AuditFixProps) {
  return (
    <ReportSection pageBreak>
      <ReportKicker>The Fix</ReportKicker>
      <ReportHeading>Three habits release most of it.</ReportHeading>

      <div className='grid gap-[21px] md:grid-cols-3'>
        {FIX_HABITS.map((habit, index) => (
          <div key={habit.title} className='audit-panel-keylime flex flex-col gap-3 p-7'>
            <p className='font-audit-sans text-audit-ink text-3xl font-light tabular-nums'>
              {index + 1}
            </p>
            <p className='font-audit-serif text-audit-ink text-[23px] font-normal'>{habit.title}</p>
            <p className='font-audit-sans text-audit-charcoal text-[14px] leading-relaxed'>
              {habit.body}
            </p>
          </div>
        ))}
      </div>

      <ReportProse>{narrative.fixReleaseCopy}</ReportProse>

      <div className='audit-panel-sage flex flex-col gap-3 p-7 sm:p-[42px]'>
        <p className='font-audit-serif text-audit-ink text-[23px] font-normal sm:text-[28px]'>
          RevCollect runs this entire playbook automatically.
        </p>
        <ReportProse>
          Every reply read and classified. Every promise tracked to its date. Every follow-up
          drafted with the invoices attached, waiting for your one-tap approval. And the judgment
          layer this report demonstrates, working your book every night. This audit is what the
          agent saw in your history; the trial is what it does about it.
        </ReportProse>
        <p className='font-audit-sans text-audit-ink text-[14px] font-medium'>
          Start the 7-day agent trial · free ·{' '}
          <a
            href='https://revcollect.ai'
            className='underline decoration-[var(--audit-ink)] underline-offset-2'
          >
            revcollect.ai
          </a>
        </p>
        <ReportProse className='text-[12px] sm:text-[14px]'>
          Your data is never used to train AI models. Every send is approved by you. Setup takes 15
          minutes from QuickBooks or Xero.
        </ReportProse>
      </div>
    </ReportSection>
  );
}
