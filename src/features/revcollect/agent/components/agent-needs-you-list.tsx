'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { useCustomers, useInboxMessages } from '@/features/revcollect/api/queries';
import { formatCurrencyWhole } from '@/features/revcollect/utils';
import { listNeedsYou, needsYouReason } from '../lib/needs-you';

export function AgentNeedsYouList() {
  const { data: messages = [], isPending: messagesPending } = useInboxMessages();
  const { data: customers = [], isPending: customersPending } = useCustomers();
  const rows = useMemo(() => listNeedsYou(messages, customers), [messages, customers]);

  if (messagesPending || customersPending) {
    return <p className='text-muted-foreground text-sm'>Loading what needs you…</p>;
  }

  if (rows.length === 0) {
    return (
      <WorkspaceCard className='p-4 md:p-5'>
        <h2 className='text-sm font-medium'>Needs you</h2>
        <p className='text-muted-foreground mt-1 text-sm'>Nothing is waiting.</p>
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard className='p-4 md:p-5'>
      <h2 className='text-sm font-medium'>Needs you</h2>
      <p className='text-muted-foreground mt-1 text-sm'>
        {rows.length === 1 ? '1 thread needs a person.' : `${rows.length} threads need a person.`}
      </p>
      <ul className='mt-3 divide-y rounded-lg border'>
        {rows.map((row) => (
          <li key={row.message.id}>
            <Link
              href={`/inbox/${row.message.id}`}
              className='hover:bg-muted/60 flex items-start justify-between gap-3 px-3 py-3'
            >
              <span className='min-w-0'>
                <span className='block truncate text-sm font-medium'>{row.customer.company}</span>
                <span className='text-muted-foreground block text-xs'>
                  {needsYouReason(row.status)}
                </span>
              </span>
              <span className='shrink-0 text-sm'>
                {formatCurrencyWhole(row.customer.balanceCents)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </WorkspaceCard>
  );
}
