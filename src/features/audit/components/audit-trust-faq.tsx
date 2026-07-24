'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { AUDIT_FAQ, AUDIT_TRUST } from '@/features/audit/lib/ui-copy';

export function AuditTrustFaq() {
  return (
    <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 pb-16 sm:px-8 print:hidden'>
      <div className='grid gap-6 sm:grid-cols-3'>
        {AUDIT_TRUST.map((item) => (
          <div key={item.title} className='flex flex-col gap-2'>
            <h3 className='font-audit-serif text-audit-ink text-[18px] font-normal'>
              {item.title}
            </h3>
            <p className='font-audit-sans text-audit-charcoal text-[14px] leading-[1.5]'>
              {item.body}
            </p>
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-2'>
        <h3 className='font-audit-serif text-audit-ink text-[22px] font-normal'>Questions</h3>
        <Accordion type='single' collapsible className='w-full'>
          {AUDIT_FAQ.map((item, index) => (
            <AccordionItem key={item.q} value={`faq-${index}`}>
              <AccordionTrigger className='font-audit-sans text-audit-ink text-[14px] font-medium'>
                {item.q}
              </AccordionTrigger>
              <AccordionContent className='font-audit-sans text-audit-charcoal text-[14px] leading-[1.5]'>
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
