'use client';

import { formatDateTimeTitle, formatRelativeDate } from '../../utils';

interface EmailTurnDividerProps {
  sentAt: string;
}

export function EmailTurnDivider({ sentAt }: EmailTurnDividerProps) {
  const sentDate = new Date(sentAt);

  return (
    <div className='flex w-full min-w-0 items-center gap-3 py-1'>
      <div className='bg-border h-px flex-1' />
      <time
        className='text-muted-foreground shrink-0 text-[11px] whitespace-nowrap'
        dateTime={sentAt}
        title={formatDateTimeTitle(sentDate)}
      >
        {formatRelativeDate(sentAt)} ·{' '}
        {sentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </time>
      <div className='bg-border h-px flex-1' />
    </div>
  );
}
