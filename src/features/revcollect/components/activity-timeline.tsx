import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '../utils';
import type { TimelineEvent, TimelineEventType } from '../types';

const eventIcons: Record<TimelineEventType, typeof Icons.send> = {
  email_sent: Icons.send,
  email_received: Icons.inbox,
  call: Icons.phone,
  payment: Icons.billing,
  note: Icons.page,
  promise: Icons.check
};

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  if (events.length === 0) {
    return <p className='text-muted-foreground text-sm'>No activity recorded yet.</p>;
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  return (
    <ol className={cn('relative space-y-4', className)}>
      {sorted.map((event, index) => {
        const Icon = eventIcons[event.type];
        return (
          <li key={event.id} className='relative flex gap-3 pl-1'>
            {index < sorted.length - 1 ? (
              <span
                className='bg-border absolute top-8 left-4 h-[calc(100%+0.5rem)] w-px'
                aria-hidden
              />
            ) : null}
            <div className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-full'>
              <Icon className='size-4' />
            </div>
            <div className='min-w-0 flex-1 pb-1'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='text-sm font-medium'>{event.title}</p>
                <time className='text-muted-foreground text-xs'>
                  {formatRelativeDate(event.occurredAt)}
                </time>
              </div>
              <p className='text-muted-foreground mt-0.5 text-sm'>{event.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
