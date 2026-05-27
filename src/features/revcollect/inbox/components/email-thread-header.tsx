'use client';

import { cn } from '@/lib/utils';
import { formatDateTimeTitle, formatRelativeDate } from '../../utils';
import type { ThreadEmail } from '../../types';

function EmailHeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex gap-2 text-[11px] leading-snug'>
      <span className='text-muted-foreground w-9 shrink-0 font-medium'>{label}</span>
      <span className='min-w-0 break-all'>{value}</span>
    </div>
  );
}

interface EmailThreadHeaderProps {
  email: ThreadEmail;
  showSubject?: boolean;
  className?: string;
}

export function EmailThreadHeader({
  email,
  showSubject = true,
  className
}: EmailThreadHeaderProps) {
  const sentDate = new Date(email.sentAt);

  return (
    <header className={cn('bg-background w-full min-w-0 shrink-0 py-3', className)}>
      {showSubject ? (
        <div className='flex items-start justify-between gap-3'>
          <h2 className='min-w-0 flex-1 text-sm font-semibold leading-snug'>{email.subject}</h2>
          <time
            className='text-muted-foreground shrink-0 text-right text-[11px] leading-snug whitespace-nowrap'
            dateTime={email.sentAt}
            title={formatDateTimeTitle(sentDate)}
          >
            <span className='block'>{formatRelativeDate(email.sentAt)}</span>
            <span className='block'>
              {sentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })}
            </span>
          </time>
        </div>
      ) : (
        <div className='flex justify-end'>
          <time
            className='text-muted-foreground text-right text-[11px] leading-snug whitespace-nowrap'
            dateTime={email.sentAt}
            title={formatDateTimeTitle(sentDate)}
          >
            {formatRelativeDate(email.sentAt)} ·{' '}
            {sentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </time>
        </div>
      )}
      <div className={cn('space-y-1', showSubject && 'mt-2')}>
        <EmailHeaderRow label='From' value={email.from} />
        <EmailHeaderRow label='To' value={email.to.join(', ')} />
        {email.cc?.length ? <EmailHeaderRow label='Cc' value={email.cc.join(', ')} /> : null}
      </div>
    </header>
  );
}
