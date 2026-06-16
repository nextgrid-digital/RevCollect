'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CustomerAvatar } from '../../components/customer-avatar';
import {
  useCustomer,
  useCustomerInboxContext,
  useInboxThreadForCustomer,
  useInvoicesForCustomer,
  useThreadEmails,
  useTimelineForCustomer
} from '../../api/queries';
import { InboxActivityCard } from '../../inbox/components/inbox-activity-card';
import { InboxAiInsightCard } from '../../inbox/components/inbox-ai-insight-card';
import { InboxContextSectionLabel } from '../../inbox/components/inbox-context-section-label';
import type { Invoice } from '../../types';
import { CustomerDetailMetricsRow } from './customer-detail-metrics-row';
import { CustomerOutstandingInvoiceCard } from './customer-outstanding-invoice-card';

interface CustomersDetailPanelProps {
  customerId: string;
  className?: string;
}

function sortOutstandingInvoices(invoices: Invoice[]): Invoice[] {
  return [...invoices]
    .filter((invoice) => invoice.status !== 'current')
    .sort((a, b) => {
      const statusOrder = { overdue: 0, in_dispute: 1, due_soon: 2, promised: 3, current: 4 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
}

export function CustomersDetailPanel({ customerId, className }: CustomersDetailPanelProps) {
  const router = useRouter();
  const { data: customer, isPending } = useCustomer(customerId);
  const { data: inboxContext } = useCustomerInboxContext(customerId);
  const { data: invoices = [] } = useInvoicesForCustomer(customerId);
  const { data: timeline = [] } = useTimelineForCustomer(customerId);
  const { data: inboxThread } = useInboxThreadForCustomer(customerId);
  const { data: threadEmails = [] } = useThreadEmails(inboxThread?.id);

  if (isPending) {
    return (
      <div
        className={cn(
          'text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm',
          className
        )}
      >
        Loading customer…
      </div>
    );
  }

  if (!customer) {
    notFound();
  }

  const followUpHref = inboxThread ? `/inbox/${inboxThread.id}` : '/inbox';
  const outstandingInvoices = sortOutstandingInvoices(invoices);
  const aiInsightText = inboxContext?.deepAnalysis?.trim() || inboxContext?.aiInsight?.trim() || '';
  const paymentTerms = inboxContext?.paymentTerms ?? 'Net-30';

  const handleActivityEmailClick = (emailId: string) => {
    if (!inboxThread) return;
    router.push(`/inbox/${inboxThread.id}#${emailId}`);
  };

  const handleCall = () => {
    toast.message('Call scheduled (mock)', {
      description: `Would dial contact for ${customer.company}`
    });
  };

  return (
    <div className={cn('bg-background flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
          <div className='scroll-stable min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 md:px-6 md:py-4'>
            <div className='space-y-6'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div className='flex min-w-0 items-start gap-4'>
                  <CustomerAvatar name={customer.company} className='size-12 shrink-0' />
                  <div className='min-w-0'>
                    <h2 className='text-xl font-semibold sm:text-2xl'>{customer.company}</h2>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {customer.name} · {customer.email} · {paymentTerms}
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <Button type='button' variant='outline' onClick={handleCall}>
                    Call
                  </Button>
                  <Button asChild>
                    <Link href={followUpHref}>Follow up</Link>
                  </Button>
                </div>
              </div>

              {inboxContext ? (
                <CustomerDetailMetricsRow
                  outstandingCents={customer.balanceCents}
                  avgDsoDays={inboxContext.avgDsoDays}
                  followUpsSent={inboxContext.followUpsSent}
                  lifetimeValueCents={inboxContext.lifetimeValueCents}
                  isOverdue={customer.daysOverdue > 0}
                />
              ) : null}

              {aiInsightText ? (
                <section className='space-y-2'>
                  <InboxContextSectionLabel>AI insight</InboxContextSectionLabel>
                  <InboxAiInsightCard text={aiInsightText} hideLabel variant='customer' />
                </section>
              ) : null}

              {outstandingInvoices.length > 0 ? (
                <section className='space-y-2'>
                  <InboxContextSectionLabel>Outstanding invoices</InboxContextSectionLabel>
                  <div className='space-y-2'>
                    {outstandingInvoices.map((invoice) => (
                      <CustomerOutstandingInvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        followUpHref={followUpHref}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <section className='space-y-2'>
                  <InboxContextSectionLabel>Outstanding invoices</InboxContextSectionLabel>
                  <p className='text-muted-foreground px-1 text-sm'>No open invoices.</p>
                </section>
              )}
            </div>
          </div>
        </div>

        <aside className='border-border/60 flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l'>
          <div className='scroll-stable flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 pb-4 pt-3'>
            <InboxActivityCard
              events={timeline}
              threadEmails={threadEmails}
              onEventClick={inboxThread ? handleActivityEmailClick : undefined}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
