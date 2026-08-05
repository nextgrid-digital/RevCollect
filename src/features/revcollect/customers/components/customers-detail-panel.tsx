'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { cn } from '@/lib/utils';
import {
  workspaceCenterMaxWidth,
  workspaceContextWidth
} from '@/features/revcollect/lib/workspace-layout';
import { MotionStagger, MotionStaggerItem } from '@/features/revcollect/motion/motion-primitives';
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
  hideActivityAside?: boolean;
}

function sortOutstandingInvoices(invoices: Invoice[]): Invoice[] {
  return [...invoices]
    .filter((invoice) => invoice.amountCents > 0)
    .sort((a, b) => {
      const statusOrder = { overdue: 0, in_dispute: 1, due_soon: 2, promised: 3, current: 4 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
}

export function CustomerActivityAside({
  timeline,
  threadEmails,
  onEventClick
}: {
  timeline: Parameters<typeof InboxActivityCard>[0]['events'];
  threadEmails: Parameters<typeof InboxActivityCard>[0]['threadEmails'];
  onEventClick?: (emailId: string) => void;
}) {
  return (
    <div className='scroll-stable flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-4'>
      <InboxActivityCard
        events={timeline}
        threadEmails={threadEmails}
        onEventClick={onEventClick}
      />
    </div>
  );
}

export function CustomersDetailPanel({
  customerId,
  className,
  hideActivityAside = false
}: CustomersDetailPanelProps) {
  const router = useRouter();
  const [activityOpen, setActivityOpen] = useState(false);
  const { data: customer, isPending } = useCustomer(customerId);
  const { data: inboxContext } = useCustomerInboxContext(customerId);
  const { data: invoices = [] } = useInvoicesForCustomer(customerId);
  const { data: timeline = [] } = useTimelineForCustomer(customerId);
  const { data: inboxThread } = useInboxThreadForCustomer(customerId);
  const { data: threadEmails = [] } = useThreadEmails(inboxThread?.id);

  useEffect(() => {
    setActivityOpen(false);
  }, [customerId]);

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

  const activityAside = (
    <CustomerActivityAside
      timeline={timeline}
      threadEmails={threadEmails}
      onEventClick={inboxThread ? handleActivityEmailClick : undefined}
    />
  );

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className)}>
      <div className='flex min-h-0 min-w-0 flex-1 gap-4'>
        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
          <div className='scroll-stable min-h-0 flex-1 overflow-x-hidden overflow-y-auto'>
            <div className={cn(workspaceCenterMaxWidth, 'space-y-6 px-4 py-3 md:px-0 md:py-4')}>
              <MotionStagger staggerKey={customerId} className='space-y-6'>
                <MotionStaggerItem index={0}>
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div className='flex min-w-0 items-start gap-4'>
                      <CustomerAvatar name={customer.company} className='size-12 shrink-0' />
                      <div className='min-w-0'>
                        {hideActivityAside ? null : (
                          <h2 className='text-xl font-semibold sm:text-2xl'>{customer.company}</h2>
                        )}
                        <p
                          className={cn(
                            'text-muted-foreground text-sm',
                            hideActivityAside ? undefined : 'mt-1'
                          )}
                        >
                          {customer.name} · {customer.email} · {paymentTerms}
                        </p>
                      </div>
                    </div>
                    <div className='flex shrink-0 flex-wrap items-center gap-2'>
                      <Sheet open={activityOpen} onOpenChange={setActivityOpen}>
                        <SheetTrigger asChild>
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            className='size-9 md:hidden'
                            aria-label='Open activity'
                          >
                            <Icons.clock className='size-4' />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side='right' className='w-full p-0 sm:max-w-sm'>
                          <SheetHeader className='sr-only'>
                            <SheetTitle>Activity</SheetTitle>
                          </SheetHeader>
                          {activityAside}
                        </SheetContent>
                      </Sheet>
                      <Button asChild>
                        <Link href={followUpHref}>Follow up</Link>
                      </Button>
                    </div>
                  </div>
                </MotionStaggerItem>

                {inboxContext ? (
                  <MotionStaggerItem index={1}>
                    <CustomerDetailMetricsRow
                      outstandingCents={customer.balanceCents}
                      avgDsoDays={inboxContext.avgDsoDays}
                      followUpsSent={inboxContext.followUpsSent}
                      lifetimeValueCents={inboxContext.lifetimeValueCents}
                      isOverdue={customer.daysOverdue > 0}
                    />
                  </MotionStaggerItem>
                ) : null}

                {aiInsightText ? (
                  <MotionStaggerItem index={2}>
                    <section className='space-y-2'>
                      <InboxContextSectionLabel>AI insight</InboxContextSectionLabel>
                      <InboxAiInsightCard text={aiInsightText} hideLabel variant='customer' />
                    </section>
                  </MotionStaggerItem>
                ) : null}

                {outstandingInvoices.length > 0 ? (
                  <MotionStaggerItem index={3}>
                    <section className='space-y-2'>
                      <InboxContextSectionLabel>{`Outstanding invoices (${outstandingInvoices.length})`}</InboxContextSectionLabel>
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
                  </MotionStaggerItem>
                ) : (
                  <MotionStaggerItem index={3}>
                    <section className='space-y-2'>
                      <InboxContextSectionLabel>Outstanding invoices (0)</InboxContextSectionLabel>
                      <p className='text-muted-foreground px-1 text-sm'>No open invoices.</p>
                    </section>
                  </MotionStaggerItem>
                )}
              </MotionStagger>
            </div>
          </div>
        </div>

        {!hideActivityAside ? (
          <div
            className={cn(
              'hidden min-h-0 min-w-0 shrink-0 flex-col gap-2 self-stretch md:flex',
              workspaceContextWidth
            )}
          >
            <div className='h-8 shrink-0' aria-hidden />
            <WorkspaceCard variant='context' className='min-h-0 w-full min-w-0 flex-1'>
              {activityAside}
            </WorkspaceCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
