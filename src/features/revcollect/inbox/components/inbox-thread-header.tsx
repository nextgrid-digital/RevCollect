'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AgentDraftMeta, Customer } from '../../types';
import type { InboxThreadActionStatus } from '../lib/get-inbox-thread-action-status';
import { getInboxThreadHeroMessage } from './inbox-thread-hero-action';
import { RelationshipBadge } from '../../components/relationship-badge';

interface InboxThreadHeaderProps {
  customer: Customer;
  subject?: string;
  agentDraftMeta?: AgentDraftMeta;
  unread?: boolean;
  actionStatus?: InboxThreadActionStatus;
  className?: string;
}

export function InboxThreadHeader({
  customer,
  subject,
  agentDraftMeta,
  unread = false,
  actionStatus,
  className
}: InboxThreadHeaderProps) {
  const heroMessage = getInboxThreadHeroMessage(
    customer.company,
    agentDraftMeta,
    unread,
    actionStatus
  );
  const title = subject ?? customer.company;

  return (
    <header className={cn('bg-background flex min-w-0 items-center', className)}>
      <div className='flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden'>
        <Link
          href={`/customers/${customer.id}`}
          className='text-foreground min-w-0 shrink truncate text-sm font-semibold leading-snug hover:underline underline-offset-2'
        >
          {title}
        </Link>
        <span className='text-muted-foreground shrink-0 text-xs' aria-hidden>
          ·
        </span>
        <p className='text-foreground/80 min-w-0 shrink truncate text-xs font-medium'>
          {heroMessage}
        </p>
        <RelationshipBadge customer={customer} className='ml-1 shrink-0' />
      </div>
    </header>
  );
}
