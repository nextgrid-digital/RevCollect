import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AboutView() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24'>
        <p className='text-primary text-sm font-medium tracking-wide uppercase'>About</p>
        <h1 className='text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl'>
          Collections software for the firms who actually run AR
        </h1>
        <p className='text-muted-foreground mt-6 text-lg leading-relaxed'>
          RevCollect is built by{' '}
          <a
            href='https://nextgrid.digital'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary font-medium hover:underline'
          >
            Nextgrid Digital
          </a>{' '}
          for bookkeepers and finance teams who manage accounts receivable across multiple client
          books. Chasing overdue invoices shouldn&apos;t mean living in scattered Gmail threads and
          spreadsheets.
        </p>

        <div className='mt-12 space-y-8'>
          <section>
            <h2 className='text-foreground text-xl font-semibold'>What we believe</h2>
            <p className='text-muted-foreground mt-3 leading-relaxed'>
              AI should draft the repetitive follow-ups — humans should approve every message before
              it reaches a customer. Your firm keeps control of tone, timing, and escalation. AR
              data stays isolated per workspace with audit trails built in from day one.
            </p>
          </section>

          <section>
            <h2 className='text-foreground text-xl font-semibold'>Where we are today</h2>
            <p className='text-muted-foreground mt-3 leading-relaxed'>
              RevCollect is in private beta. The product you can demo today runs on realistic mock
              data while we finish Supabase-backed sync with QuickBooks and Gmail. We&apos;re
              inviting waitlist firms in small cohorts so we can support onboarding properly.
            </p>
          </section>

          <section>
            <h2 className='text-foreground text-xl font-semibold'>Who it&apos;s for</h2>
            <ul className='text-muted-foreground mt-3 list-disc space-y-2 pl-5 leading-relaxed'>
              <li>Bookkeeping and accounting firms managing AR for clients</li>
              <li>In-house finance teams with overdue invoice volume worth automating</li>
              <li>Teams already on QuickBooks Online and Gmail for client communication</li>
            </ul>
          </section>
        </div>

        <div className='mt-12 flex flex-wrap gap-3'>
          <Button asChild>
            <Link href='/waitlist'>Join waitlist</Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href='/changelog'>Read the changelog</Link>
          </Button>
        </div>
      </div>
  );
}
