import Link from 'next/link';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const BEATS = [
  {
    title: 'Looks at overdue invoices',
    description: 'Age, amount, and who owes — the same picture you see in Xero aging.'
  },
  {
    title: 'Leaves draft emails in Inbox',
    description: 'Ready for you to review in the morning, like letters left on your desk.'
  },
  {
    title: 'You send, edit, or skip',
    description: 'Same as a junior AR clerk: they draft, you decide what goes out.'
  }
] as const;

const NEVER_DOES = [
  'Never sends email to the customer',
  'Never changes anything in Xero',
  'Never talks to the customer without you'
] as const;

interface AgentJobStoryProps {
  compact?: boolean;
  className?: string;
}

export function AgentJobStory({ compact = false, className }: AgentJobStoryProps) {
  return (
    <section className={cn('space-y-4', className)} aria-labelledby='agent-job-story-heading'>
      <div>
        <h2 id='agent-job-story-heading' className='text-base font-semibold'>
          Payment reminders
        </h2>
        <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
          Overnight, RevCollect writes reminder emails for overdue invoices. In the morning you open
          Inbox, edit if you want, and send.{' '}
          <span className='text-foreground font-medium'>
            Nothing goes to the customer unless you send it.
          </span>
        </p>
      </div>

      <ol className='grid gap-3 sm:grid-cols-3'>
        {BEATS.map((beat, index) => (
          <li key={beat.title} className='bg-muted/30 flex flex-col gap-2 rounded-lg border p-4'>
            <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {index + 1}
            </span>
            <p className='text-sm font-medium'>{beat.title}</p>
            <p className='text-muted-foreground text-sm leading-relaxed'>{beat.description}</p>
          </li>
        ))}
      </ol>

      <div>
        <p className='text-sm font-medium'>What it never does</p>
        <ul className='mt-2 space-y-1.5'>
          {NEVER_DOES.map((item) => (
            <li key={item} className='text-muted-foreground flex items-start gap-2 text-sm'>
              <Icons.close className='mt-0.5 size-3.5 shrink-0' aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {compact ? null : (
        <p className='text-sm'>
          <Link
            href='/inbox?filter=drafts'
            className='text-foreground hover:text-primary font-medium underline-offset-4 hover:underline'
          >
            See drafts in Inbox
          </Link>
        </p>
      )}
    </section>
  );
}
