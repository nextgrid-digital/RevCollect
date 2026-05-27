interface InboxThreadSummaryCardProps {
  subject?: string;
  summary: string;
}

export function InboxThreadSummaryCard({ subject, summary }: InboxThreadSummaryCardProps) {
  return (
    <div className='overflow-hidden rounded-[16px] bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'>
      <div className='border-border/60 border-b px-4 py-3'>
        <span className='text-sm font-medium'>Summary</span>
      </div>
      <div className='px-4 py-3'>
        {subject ? <p className='truncate text-sm font-semibold'>{subject}</p> : null}
        <p className='text-muted-foreground mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap'>
          {summary}
        </p>
      </div>
    </div>
  );
}
