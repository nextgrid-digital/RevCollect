'use client';

import { Button } from '@/components/ui/button';
import { AUDIT_FOOTER_CTA } from '@/features/audit/lib/ui-copy';

export function AuditFooterCta() {
  return (
    <section className='mx-auto w-full max-w-[1200px] px-6 pb-16 sm:px-8 print:hidden'>
      <div className='audit-panel-sage flex flex-col gap-4 p-7 sm:p-10'>
        <h2 className='font-audit-serif text-audit-ink max-w-2xl text-[28px] leading-[1.35] font-normal tracking-[-0.01em] sm:text-[32px]'>
          {AUDIT_FOOTER_CTA.headline}
        </h2>
        <p className='font-audit-sans text-audit-charcoal max-w-2xl text-[14px] leading-[1.5] sm:text-[16px]'>
          {AUDIT_FOOTER_CTA.body}
        </p>
        <div className='pt-1'>
          <Button asChild className='audit-btn-forest'>
            <a href={AUDIT_FOOTER_CTA.href} target='_blank' rel='noreferrer'>
              {AUDIT_FOOTER_CTA.button}
            </a>
          </Button>
        </div>
        <p className='font-audit-sans text-audit-muted text-[12px]'>
          {AUDIT_FOOTER_CTA.smallPrint}
        </p>
      </div>
    </section>
  );
}
