'use client';

import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
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

interface InboxContextRailBodyProps {
  customer: Customer;
  context: CustomerInboxContext;
  aiInsightText?: string;
  showDetails?: boolean;
}

const INVOICE_PREVIEW_LIMIT = 2;

function sortInvoicesForRail(invoices: Invoice[]): Invoice[] {
  return [...invoices].sort((a, b) => {
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
  const { data: invoices = [] } = useInvoicesForCustomer(customer.id);
  const openInvoices = sortInvoicesForRail(
    invoices.filter((invoice) => invoice.status !== 'current')
  );
  const previewInvoices = openInvoices.slice(0, INVOICE_PREVIEW_LIMIT);
  const hasMoreInvoices = openInvoices.length > INVOICE_PREVIEW_LIMIT;
  const hasAiInsight = Boolean(aiInsightText.trim());
  const defaultAccordionSection = hasAiInsight ? 'ai-insight' : undefined;

  const [openSection, setOpenSection] = useState<string | undefined>(defaultAccordionSection);

  useEffect(() => {
    if (showDetails) {
      setOpenSection('details');
      return;
    }
    const detailsExpanded = readInboxInsightsDetailsExpanded();
    setOpenSection(detailsExpanded ? 'details' : defaultAccordionSection);
  }, [showDetails, defaultAccordionSection]);

  const handleSectionChange = (value: string) => {
    setOpenSection(value || undefined);
    writeInboxInsightsDetailsExpanded(value === 'details');
  };

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
        <InboxContextRailSection label='Open invoices' unstyled contentClassName='space-y-2 px-0.5'>
          {previewInvoices.map((invoice) => (
            <InboxContextInvoiceCard key={invoice.id} invoice={invoice} />
          ))}
          {hasMoreInvoices ? (
            <Link
              href={`/customers/${customer.id}`}
              className='text-muted-foreground hover:text-foreground block px-1 text-xs underline-offset-2 hover:underline'
            >
              View all {openInvoices.length} invoices
            </Link>
          ) : null}
        </InboxContextRailSection>
      ) : (
        <p className='text-muted-foreground px-1 text-sm'>No open invoices.</p>
      )}

      <Accordion
        type='single'
        collapsible
        value={openSection}
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
