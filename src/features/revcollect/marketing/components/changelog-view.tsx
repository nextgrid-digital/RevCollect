import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChangelogTag } from '../data/changelog';
import { changelogEntries } from '../data/changelog';

const tagStyles: Record<ChangelogTag, string> = {
  feature: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  improvement: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  fix: 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
};

const tagLabels: Record<ChangelogTag, string> = {
  feature: 'New',
  improvement: 'Improved',
  fix: 'Fixed'
};

export function ChangelogView() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24'>
        <div className='max-w-2xl'>
          <p className='text-primary text-sm font-medium tracking-wide uppercase'>Changelog</p>
          <h1 className='text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl'>
            What we&apos;ve shipped
          </h1>
          <p className='text-muted-foreground mt-4 text-lg leading-relaxed'>
            Product updates for RevCollect. We publish notes here as we roll out early access.
          </p>
        </div>

        <div className='mt-14 space-y-12'>
          {changelogEntries.map((entry) => (
            <article key={entry.version} className='border-border/60 border-b pb-12 last:border-0'>
              <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                <h2 className='text-foreground text-xl font-semibold'>v{entry.version}</h2>
                <time className='text-muted-foreground text-sm' dateTime={entry.date}>
                  {new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </time>
              </div>
              <p className='text-foreground mt-2 font-medium'>{entry.title}</p>
              <p className='text-muted-foreground mt-1 text-sm'>{entry.summary}</p>
              <ul className='mt-4 space-y-2'>
                {entry.items.map((item) => (
                  <li key={item.text} className='flex gap-2 text-sm leading-relaxed'>
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[10px] font-medium uppercase',
                        tagStyles[item.tag]
                      )}
                    >
                      {tagLabels[item.tag]}
                    </span>
                    <span className='text-muted-foreground'>{item.text}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className='bg-muted/40 mt-16 rounded-2xl px-6 py-8 text-center'>
          <p className='text-foreground font-medium'>Want access to what&apos;s next?</p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Join the waitlist to get early builds before they hit the changelog.
          </p>
          <Button asChild className='mt-4'>
            <Link href='/waitlist'>Join waitlist</Link>
          </Button>
        </div>
      </div>
  );
}
