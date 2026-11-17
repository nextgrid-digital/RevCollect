'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InboxPeekCenterDialog } from '@/features/revcollect/inbox/components/inbox-peek-center-dialog';
import { MotionReveal } from '@/features/revcollect/motion/motion-primitives';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { cn } from '@/lib/utils';
import {
  useAgentConfig,
  useAgentDraftCount,
  useAgingBuckets,
  useAgingReport,
  useCustomers,
  useInboxMessages,
  useInvoices,
  useIntegrationStatus,
  useLatestAriRun
} from '../../api/queries';
import { buildDashboardSnapshot } from '../lib/build-dashboard-snapshot';
import { applyDashboardCopy, requestDashboardCopy } from '../lib/dashboard-copy';
import { DashboardActivity } from './dashboard-activity';
import { DashboardAgingBars } from './dashboard-aging-bars';
import { DashboardAttentionCards } from './dashboard-attention-cards';
import { DashboardGreeting } from './dashboard-greeting';
import { DashboardKpiRow } from './dashboard-kpi-row';
import { connectedBooksFromStatus } from '@/lib/integrations/books-provider';
import { formatCurrencyWhole, formatDate } from '../../utils';

const dashboardMaxWidth = 'mx-auto w-full max-w-5xl';

const agingFilters = {
  period: 'all_time' as const,
  sort: 'amount_desc' as const
};

interface DashboardViewProps {
  userName: string;
}

export function DashboardView({ userName }: DashboardViewProps) {
  const { data: integrationStatus } = useIntegrationStatus();
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

  const isHydrated = useIsHydrated();
  const copyQuery = useQuery({
    queryKey: ['revcollect', 'dashboard-copy', 'v3', snapshot.copyFacts],
    queryFn: () => requestDashboardCopy(snapshot.copyFacts),
    enabled: isHydrated && !isPending && snapshot.hasArData,
    staleTime: 10 * 60 * 1000,
    retry: 1
  });
  const narrative = useMemo(
    () => applyDashboardCopy(snapshot, copyQuery.data ?? null),
    [snapshot, copyQuery.data]
  );

  const ledgerConnected = Boolean(integrationStatus && connectedBooksFromStatus(integrationStatus));
  const [peekMessageId, setPeekMessageId] = useState<string | null>(null);
  const showSkeleton = !isHydrated || isPending;

  function openThread(messageId: string) {
    setPeekMessageId(messageId);
  }

  return (
    <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
      <div className={cn(dashboardMaxWidth, 'space-y-5 pb-6')}>
        {showSkeleton ? (
          <>
            <div className='bg-muted h-10 w-64 animate-pulse rounded-md' />
            <div className='bg-muted h-16 animate-pulse rounded-xl' />
            <div className='grid gap-3 md:grid-cols-3'>
              <div className='bg-muted h-48 animate-pulse rounded-2xl' />
              <div className='bg-muted h-48 animate-pulse rounded-2xl' />
              <div className='bg-muted h-48 animate-pulse rounded-2xl' />
            </div>
          </>
        ) : (
          <>
            <MotionReveal>
              <DashboardGreeting
                userName={userName}
                overnightPayments={snapshot.overnightPayments}
                cards={narrative.attentionCards}
              />
            </MotionReveal>
            {integrationStatus &&
            !integrationStatus.xero.connected &&
            !integrationStatus.quickbooks.connected &&
            !integrationStatus.zoho.connected &&
            (integrationStatus.xero.lastSyncAt ||
              integrationStatus.quickbooks.lastSyncAt ||
              integrationStatus.zoho.lastSyncAt) ? (
              <p className='rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100'>
                Not synced. Data is from{' '}
                {formatDate(
                  integrationStatus.xero.lastSyncAt ??
                    integrationStatus.quickbooks.lastSyncAt ??
                    integrationStatus.zoho.lastSyncAt ??
                    ''
                )}
                . Totals below are from that sync.
              </p>
            ) : null}
            {snapshot.concentrationNote ? (
              <p className='rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm'>
                {snapshot.concentrationNote}
              </p>
            ) : null}
            {snapshot.needsContact.length > 0 ? (
              <div className='space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100'>
                <p className='font-medium'>Needs a contact</p>
                <ul className='space-y-1'>
                  {snapshot.needsContact.map((item) => (
                    <li key={item.customerId}>
                      {item.company} ·{' '}
                      {formatCurrencyWhole(item.balanceCents, snapshot.kpis.currency)}
                      {item.phone ? ` · ${item.phone}` : ' · no phone on file'}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <MotionReveal>
              <DashboardAttentionCards
                cards={narrative.attentionCards}
                currency={snapshot.kpis.currency}
                onOpenThread={openThread}
                ledgerConnected={ledgerConnected || snapshot.hasArData}
              />
            </MotionReveal>
            {snapshot.agingBars.length > 0 ? (
              <MotionReveal>
                <DashboardAgingBars
                  bars={snapshot.agingBars}
                  actionCount={snapshot.attentionCards.length}
                />
              </MotionReveal>
            ) : null}
            {ledgerConnected || snapshot.hasArData ? (
              <MotionReveal>
                <DashboardKpiRow kpis={snapshot.kpis} />
              </MotionReveal>
            ) : null}
            <MotionReveal>
              <DashboardActivity
                ariHourLabel={snapshot.ariHourLabel}
                ariBullets={narrative.ariBullets}
                activity={narrative.activity}
                promises={narrative.promises}
                onOpenThread={openThread}
              />
            </MotionReveal>
          </>
        )}
      </div>
      {showSkeleton ? null : (
        <InboxPeekCenterDialog messageId={peekMessageId} onClose={() => setPeekMessageId(null)} />
      )}
    </div>
  );
}
