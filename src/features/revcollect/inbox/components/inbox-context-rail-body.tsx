'use client';

import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import type { Customer, CustomerInboxContext, Invoice } from '../../types';
import { useInvoicesForCustomer } from '../../api/queries';
import {
  readInboxInsightsDetailsExpanded,
  writeInboxInsightsDetailsExpanded
} from '../lib/inbox-insights-preference';
import { InboxAiInsightCard } from './inbox-ai-insight-card';
import { InboxContextDetailsCard } from './inbox-context-details-card';
import { InboxContextInvoiceCard } from './inbox-context-invoice-card';
import { InboxContextMetricsGrid } from './inbox-context-metrics-grid';
import { InboxContextRailSection } from './inbox-context-rail-section';
import { InboxContextSectionLabel } from './inbox-context-section-label';
import { useOptionalInboxThreadAttachment } from './inbox-thread-attachment-context';

interface InboxContextRailBodyProps {
  customer: Customer;
  context: CustomerInboxContext;
  aiInsightText?: string;
  showDetails?: boolean;
}

const INVOICE_PREVIEW_LIMIT = 50;

function sortInvoicesForRail(invoices: Invoice[]): Invoice[] {
  return [...invoices]
    .filter((invoice) => invoice.amountCents > 0)
    .sort((a, b) => {
      const statusOrder = { overdue: 0, in_dispute: 1, due_soon: 2, promised: 3, current: 4 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
}

function InboxContextRailBodyComponent({
  customer,
  context,
  aiInsightText = '',
  showDetails = false
}: InboxContextRailBodyProps) {
  const attachment = useOptionalInboxThreadAttachment();
  const { data: invoices = [] } = useInvoicesForCustomer(customer.id);
  const openInvoices = sortInvoicesForRail(invoices);
  const previewInvoices = openInvoices.slice(0, INVOICE_PREVIEW_LIMIT);
  const hasMoreInvoices = openInvoices.length > INVOICE_PREVIEW_LIMIT;
  const hasAiInsight = Boolean(aiInsightText.trim());
  const allAccordionSections = hasAiInsight ? ['ai-insight', 'details'] : ['details'];

  const [openSections, setOpenSections] = useState<string[]>(allAccordionSections);

  useEffect(() => {
    setOpenSections(hasAiInsight ? ['ai-insight', 'details'] : ['details']);
  }, [customer.id, hasAiInsight]);

  useEffect(() => {
    if (showDetails) {
      setOpenSections((prev) => (prev.includes('details') ? prev : [...prev, 'details']));
      return;
    }
    if (!readInboxInsightsDetailsExpanded()) {
      setOpenSections((prev) => prev.filter((section) => section !== 'details'));
    }
  }, [showDetails]);

  const handleSectionChange = (value: string[]) => {
    setOpenSections(value);
    writeInboxInsightsDetailsExpanded(value.includes('details'));
  };

  const unattachedPreview = previewInvoices.filter(
    (invoice) => !attachment?.isAttached(invoice.number)
  );

  return (
    <div className='flex w-full shrink-0 flex-col gap-3'>
      <InboxContextRailSection unstyled contentClassName='px-0.5'>
        <InboxContextMetricsGrid
          outstandingCents={customer.balanceCents}
          avgDsoDays={context.avgDsoDays}
          followUpsSent={context.followUpsSent}
          lifetimeValueCents={context.lifetimeValueCents}
          isOverdue={customer.daysOverdue > 0}
        />
      </InboxContextRailSection>

      {openInvoices.length > 0 ? (
        <section className='w-full min-w-0 shrink-0'>
          <div className='flex items-center justify-between gap-2 px-1'>
            <InboxContextSectionLabel>Open invoices</InboxContextSectionLabel>
            {attachment && unattachedPreview.length > 0 ? (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground size-6'
                onClick={() =>
                  attachment.attachInvoices(unattachedPreview.map((invoice) => invoice.number))
                }
                aria-label={`Attach all ${unattachedPreview.length} invoices`}
                title='Attach all invoices'
              >
                <Icons.add className='size-3.5' />
              </Button>
            ) : null}
          </div>
          <div className='mt-1.5 min-w-0 space-y-2 px-0.5'>
            {previewInvoices.map((invoice) => (
              <InboxContextInvoiceCard
                key={invoice.id}
                invoice={invoice}
                isAttached={attachment?.isAttached(invoice.number) ?? false}
                onAttach={attachment ? () => attachment.attachInvoice(invoice.number) : undefined}
              />
            ))}
            {hasMoreInvoices ? (
              <Link
                href={`/customers/${customer.id}`}
                className='text-muted-foreground hover:text-foreground block px-1 text-xs underline-offset-2 hover:underline'
              >
                View all {openInvoices.length} invoices
              </Link>
            ) : null}
          </div>
        </section>
      ) : (
        <p className='text-muted-foreground px-1 text-sm'>No open invoices.</p>
      )}

      <Accordion
        type='multiple'
        value={openSections}
        onValueChange={handleSectionChange}
        className='w-full'
      >
        {hasAiInsight ? (
          <AccordionItem value='ai-insight' className='border-border/60 border-b'>
            <AccordionTrigger className='text-muted-foreground py-2 text-[11px] font-medium tracking-wide uppercase hover:no-underline'>
              AI insight
            </AccordionTrigger>
            <AccordionContent className='pb-3'>
              <InboxAiInsightCard text={aiInsightText} hideLabel />
            </AccordionContent>
          </AccordionItem>
        ) : null}

        <AccordionItem value='details' className='border-0'>
          <AccordionTrigger className='text-muted-foreground py-2 text-[11px] font-medium tracking-wide uppercase hover:no-underline'>
            Details
          </AccordionTrigger>
          <AccordionContent className='pb-1'>
            <InboxContextDetailsCard
              contactName={customer.name}
              contactEmail={customer.email}
              contactPhone={customer.phone}
              paymentTerms={context.paymentTerms}
              hideLabel
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export const InboxContextRailBody = memo(InboxContextRailBodyComponent);
