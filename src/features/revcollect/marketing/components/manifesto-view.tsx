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
          Excel and email for their simplicity. That approach became chaotic and inefficient — missed
          follow-ups with crucial customers, overlooked tasks, and no single place to see what
          mattered. Existing solutions from large industry giants often fail to adapt quickly to how
          finance teams actually work.
        </p>

        <p className='text-muted-foreground text-lg leading-relaxed'>
          We&apos;re building RevCollect, a comprehensive tool for accounts receivable management.
          It helps bookkeepers and finance teams gain deeper insight into overdue AR, streamline
          tedious follow-ups, and bridge the gap between firms and the client books they run.
          RevCollect offers intelligent task prioritization, streamlined follow-ups, AI-powered
          conversation summaries, and quick document context — so you can focus on the work that
          actually moves cash.
        </p>

        <p className='text-muted-foreground text-lg leading-relaxed'>
          We believe in transparency and collaboration with the people who use the product. Our goal
          is to make RevCollect affordable and accessible across a wide range of teams — from
          bookkeeping firms to in-house finance at growing SMBs. Despite advanced AI features,
          we&apos;re committed to reasonable pricing so anyone who needs control over receivables can
          use it.
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
