import { cn } from '@/lib/utils';
import { formatInboxActivityTime } from '../../utils';
import { resolveTimelineThreadEmailId } from '../lib/resolve-timeline-email';
import type { ThreadEmail, TimelineEvent } from '../../types';

function getActivityDotClass(event: TimelineEvent): string {
  if (event.type === 'email_received') {
    return 'bg-emerald-500';
  }

  const text = `${event.title} ${event.description}`.toLowerCase();
  if (text.includes('escalation') || text.includes('reminder') || text.includes('final notice')) {
    return 'bg-destructive';
  }

  return 'bg-muted-foreground/50';
}

interface InboxActivityTimelineProps {
  events: TimelineEvent[];
  threadEmails: ThreadEmail[];
  onEventClick?: (emailId: string, event?: TimelineEvent) => void;
}

export function InboxActivityTimeline({
  events,
  threadEmails,
  onEventClick
}: InboxActivityTimelineProps) {
  if (events.length === 0) {
    return <p className='text-muted-foreground text-sm'>No activity recorded yet.</p>;
  }

  const sorted = events.toSorted(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  return (
    <ol>
      {sorted.map((event, index) => {
        const isLast = index === sorted.length - 1;

        const linkedEmailId = resolveTimelineThreadEmailId(event, threadEmails);
        const isClickable = Boolean(linkedEmailId && onEventClick);

        return (
          <li key={event.id} className={cn('flex gap-2.5', !isLast && 'pb-3')}>
            <div className='relative w-2 shrink-0 self-stretch'>
              <span
                className={cn(
                  'absolute top-1.5 left-1/2 z-10 size-2 -translate-x-1/2 rounded-full',
                  getActivityDotClass(event)
                )}
                aria-hidden
              />
              {!isLast ? (
                <span
                  className='bg-border absolute top-3.5 bottom-0 left-1/2 w-px -translate-x-1/2'
                  aria-hidden
                />
              ) : null}
            </div>
            {isClickable ? (
              <button
                type='button'
                onClick={() => onEventClick!(linkedEmailId!, event)}
                aria-label={`View email for ${event.title}`}
                className='hover:bg-muted/60 focus-visible:ring-ring min-w-0 flex-1 rounded-lg px-2 py-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none'
              >
                <p className='text-sm leading-snug font-medium'>{event.title}</p>
                <time
                  className='text-muted-foreground mt-0.5 block text-[11px] leading-snug tabular-nums'
                  dateTime={event.occurredAt}
                >
                  {formatInboxActivityTime(event.occurredAt)}
                </time>
                <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
                  {event.description}
                </p>
              </button>
            ) : (
              <div className='min-w-0 flex-1 px-2 py-1'>
                <p className='text-sm leading-snug font-medium'>{event.title}</p>
                <time
                  className='text-muted-foreground mt-0.5 block text-[11px] leading-snug tabular-nums'
                  dateTime={event.occurredAt}
                >
                  {formatInboxActivityTime(event.occurredAt)}
                </time>
                <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
                  {event.description}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
