'use client';

import type { ReactNode } from 'react';
import { Icons } from '@/components/icons';

interface ConversationSummaryCardProps {
  subject: string;
  summary: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function ConversationSummaryCard({
  subject,
  summary,
  leading,
  trailing
}: ConversationSummaryCardProps) {
  return (
    <div className='bg-primary/5 shrink-0 border-b px-4 py-2 md:px-6'>
      <div className='flex items-center gap-2'>
        {leading}
        <h2 className='min-w-0 flex-1 truncate text-xs font-semibold'>{subject}</h2>
        {trailing}
      </div>
      <div className='text-muted-foreground mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed'>
        <Icons.sparkles className='text-primary mt-0.5 size-3.5 shrink-0' />
        <p className='line-clamp-2 min-w-0 flex-1'>{summary}</p>
      </div>
    </div>
  );
}
