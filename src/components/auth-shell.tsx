'use client';

import { FloatingPaths } from '@/components/floating-paths';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

function RevCollectMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icons.logo className='size-8 shrink-0' />
      <span className='text-sm font-semibold tracking-tight'>RevCollect</span>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className='relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2'>
      <div className='bg-secondary relative hidden h-full flex-col border-r p-10 lg:flex dark:bg-secondary/20'>
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background' />
        <RevCollectMark className='relative z-10 mr-auto' />

        <div className='z-10 mt-auto max-w-lg'>
          <p className='text-xl'>Collections inbox for bookkeepers.</p>
        </div>
        <div className='absolute inset-0'>
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className='relative flex min-h-screen flex-col justify-center px-8'>
        <div aria-hidden className='absolute inset-0 -z-10 opacity-60 contain-strict isolate'>
          <div className='absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]' />
          <div className='absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]' />
          <div className='absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]' />
        </div>

        <div className='mx-auto w-full space-y-4 sm:w-sm'>
          <RevCollectMark className='lg:hidden' />
          {children}
        </div>
      </div>
    </main>
  );
}
