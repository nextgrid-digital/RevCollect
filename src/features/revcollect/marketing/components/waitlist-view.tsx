import Link from 'next/link';
import { WaitlistForm } from './waitlist-form';

export function WaitlistView() {
  return (
    <div className='mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24'>
        <p className='text-primary text-sm font-medium tracking-wide uppercase'>Early access</p>
        <h1 className='text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl'>
          Join the RevCollect waitlist
        </h1>
        <p className='text-muted-foreground mt-4 text-lg leading-relaxed'>
          We&apos;re onboarding bookkeepers and finance teams in small batches. Leave your email and
          we&apos;ll notify you when your spot opens — usually within a few weeks.
        </p>

        <div className='bg-card border-border/60 mt-10 rounded-2xl border p-6 shadow-sm sm:p-8'>
          <WaitlistForm idPrefix='page' />
        </div>

        <p className='text-muted-foreground mt-8 text-center text-sm'>
          Already have access?{' '}
          <Link href='/inbox' className='text-primary font-medium hover:underline'>
            Open the demo dashboard
          </Link>
        </p>
      </div>
  );
}
