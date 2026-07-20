import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

export function WelcomeView() {
  return (
    <div className='relative flex min-h-svh flex-col overflow-hidden'>
      <div
        className='pointer-events-none absolute inset-0 -z-10'
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% -10%, color-mix(in oklab, var(--primary) 28%, transparent), transparent 70%), linear-gradient(180deg, var(--background) 0%, color-mix(in oklab, var(--muted) 45%, var(--background)) 100%)'
        }}
      />
      <div
        className='pointer-events-none absolute inset-0 -z-10 opacity-[0.35]'
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklab, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 8%, transparent) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)'
        }}
      />

      <header className='flex items-center justify-between px-6 py-5 sm:px-10'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg'>
            <Icons.logo className='size-4' />
          </div>
          <span className='text-sm font-semibold tracking-tight'>RevCollect</span>
        </div>
        <div className='flex items-center gap-2'>
          <Button asChild variant='ghost' size='sm'>
            <Link href='/login'>Sign in</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href='/signup'>Get started</Link>
          </Button>
        </div>
      </header>

      <main className='flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center sm:px-10'>
        <p className='text-primary mb-4 text-xs font-medium tracking-[0.2em] uppercase'>
          Accounts receivable
        </p>
        <h1 className='font-heading max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl'>
          RevCollect
        </h1>
        <p className='text-muted-foreground mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg'>
          One inbox for overdue invoices, customer context, and follow-ups — so your team collects
          with clarity.
        </p>
        <div className='mt-10 flex flex-wrap items-center justify-center gap-3'>
          <Button asChild size='lg'>
            <Link href='/signup'>Create account</Link>
          </Button>
          <Button asChild size='lg' variant='outline'>
            <Link href='/login'>Sign in</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
