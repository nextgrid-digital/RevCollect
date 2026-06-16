import type { ReactNode } from 'react';

interface LegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className='px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-8'>
        <h1 className='text-foreground text-3xl font-bold'>{title}</h1>
        {children}
        <div className='border-border border-t pt-4'>
          <p className='text-muted-foreground text-sm'>Last updated: {lastUpdated}</p>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className='text-foreground mb-3 text-xl font-semibold'>{title}</h2>
      <div className='text-muted-foreground space-y-3 text-base leading-relaxed'>{children}</div>
    </section>
  );
}
