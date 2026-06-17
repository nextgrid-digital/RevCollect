import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ManifestoView() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24'>
      <p className='text-primary text-sm font-medium tracking-wide uppercase'>Manifesto</p>
      <h1 className='text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl'>
        Control your receivables
      </h1>

      <div className='mt-12 space-y-8'>
        <p className='text-muted-foreground text-lg leading-relaxed'>
          After years in finance, we&apos;ve consistently struggled with managing cash flow and
          maintaining visibility on collections. Despite using multiple tools, we often resorted to
          Excel and email for their simplicity. That approach became chaotic and inefficient —
          missed follow-ups with crucial customers, overlooked tasks, and no single place to see
          what mattered. Existing solutions from large industry giants often fail to adapt quickly
          to how finance teams actually work.
        </p>

        <p className='text-muted-foreground text-lg leading-relaxed'>
          We&apos;re building RevCollect as a context-rich collections workflow — not another
          feature-heavy AR tool. Bookkeepers and finance teams open invoices, see customer context
          at the point of action, and follow up on their terms. An optional Collections Agent add-on
          watches what matters and prepares drafts, digests, and alerts before you ask. It is a
          proactive operator, not a chatbot and not a complex automation builder. Human approval on
          every outbound message is non-negotiable.
        </p>

        <p className='text-muted-foreground text-lg leading-relaxed'>
          We believe in transparency and collaboration with the people who use the product. Our goal
          is to make RevCollect affordable and accessible across a wide range of teams — from
          bookkeeping firms to in-house finance at growing SMBs. Despite advanced AI features,
          we&apos;re committed to reasonable pricing so anyone who needs control over receivables
          can use it.
        </p>
      </div>

      <div className='mt-12 flex flex-wrap gap-3'>
        <Button asChild>
          <Link href='/waitlist'>Join waitlist</Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/inbox'>View demo</Link>
        </Button>
      </div>
    </div>
  );
}
