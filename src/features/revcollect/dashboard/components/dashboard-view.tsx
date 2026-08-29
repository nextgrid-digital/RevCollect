'use client';

import { useMemo, useState } from 'react';
import { InboxPeekCenterDialog } from '@/features/revcollect/inbox/components/inbox-peek-center-dialog';
import { MotionReveal } from '@/features/revcollect/motion/motion-primitives';
import { cn } from '@/lib/utils';
import {
  useAgentConfig,
  useAgentDraftCount,
  useAgingBuckets,
  useAgingReport,
  useCustomers,
  useInboxMessages,
  useInvoices,
  useLatestAriRun
} from '../../api/queries';
import { buildDashboardSnapshot } from '../lib/build-dashboard-snapshot';
import { DashboardActivity } from './dashboard-activity';
import { DashboardAgingBars } from './dashboard-aging-bars';
import { DashboardAttentionBanner } from './dashboard-attention-banner';
import { DashboardAttentionCards } from './dashboard-attention-cards';
import { DashboardGreeting } from './dashboard-greeting';
import { DashboardKpiRow } from './dashboard-kpi-row';

const dashboardMaxWidth = 'mx-auto w-full max-w-5xl';

const agingFilters = {
  period: 'all_time' as const,
  sort: 'amount_desc' as const
};

interface DashboardViewProps {
  userName: string;
}

export function DashboardView({ userName }: DashboardViewProps) {
  const customersQuery = useCustomers();
  const invoicesQuery = useInvoices();
  const inboxQuery = useInboxMessages();
  const agingBucketsQuery = useAgingBuckets();
  const agingReportQuery = useAgingReport(agingFilters);
  const agentQuery = useAgentConfig();
  const draftCountQuery = useAgentDraftCount();
  const ariRunQuery = useLatestAriRun();

  const isPending =
    customersQuery.isPending ||
    invoicesQuery.isPending ||
    inboxQuery.isPending ||
    agingBucketsQuery.isPending ||
    agingReportQuery.isPending ||
    agentQuery.isPending ||
    draftCountQuery.isPending ||
    ariRunQuery.isPending;

  const snapshot = useMemo(
    () =>
      buildDashboardSnapshot({
        customers: customersQuery.data ?? [],
        invoices: invoicesQuery.data ?? [],
        inboxMessages: inboxQuery.data ?? [],
        agingBuckets: agingBucketsQuery.data ?? [],
        agingSummary: agingReportQuery.data?.summary ?? null,
        agentConfig: agentQuery.data ?? null,
        draftCount: draftCountQuery.data ?? 0,
        ariRun: ariRunQuery.data ?? null
      }),
    [
      customersQuery.data,
      invoicesQuery.data,
      inboxQuery.data,
      agingBucketsQuery.data,
      agingReportQuery.data?.summary,
      agentQuery.data,
      draftCountQuery.data,
      ariRunQuery.data
    ]
  );

  const [peekMessageId, setPeekMessageId] = useState<string | null>(null);

  function openThread(messageId: string) {
    setPeekMessageId(messageId);
  }

  if (isPending) {
    return (
      <div className={cn('scroll-stable min-h-0 flex-1 overflow-y-auto', dashboardMaxWidth)}>
        <div className='space-y-4'>
          <div className='bg-muted h-10 w-64 animate-pulse rounded-md' />
          <div className='bg-muted h-16 animate-pulse rounded-xl' />
          <div className='grid gap-3 md:grid-cols-3'>
            <div className='bg-muted h-48 animate-pulse rounded-2xl' />
            <div className='bg-muted h-48 animate-pulse rounded-2xl' />
            <div className='bg-muted h-48 animate-pulse rounded-2xl' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
      <div className={cn(dashboardMaxWidth, 'space-y-5 pb-6')}>
        <MotionReveal>
          <DashboardGreeting userName={userName} overnightPayments={snapshot.overnightPayments} />
        </MotionReveal>
        <MotionReveal>
          <DashboardAttentionBanner
            banner={snapshot.attentionBanner}
            cards={snapshot.attentionCards}
          />
        </MotionReveal>
        <MotionReveal>
          <DashboardAttentionCards cards={snapshot.attentionCards} onOpenThread={openThread} />
        </MotionReveal>
        {snapshot.agingBars.length > 0 ? (
          <MotionReveal>
            <DashboardAgingBars bars={snapshot.agingBars} />
          </MotionReveal>
        ) : null}
        <MotionReveal>
          <DashboardKpiRow kpis={snapshot.kpis} />
        </MotionReveal>
        <MotionReveal>
          <DashboardActivity
            ariHourLabel={snapshot.ariHourLabel}
            ariBullets={snapshot.ariBullets}
            activity={snapshot.activity}
            promises={snapshot.promises}
            onOpenThread={openThread}
          />
        </MotionReveal>
      </div>
      <InboxPeekCenterDialog messageId={peekMessageId} onClose={() => setPeekMessageId(null)} />
    </div>
  );
}
