import type { ReactNode } from 'react';
import Link from 'next/link';

interface LegalPageProps {
  title: string;
  children: ReactNode;
}

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <main className='mx-auto max-w-2xl px-6 py-12'>
      <p className='text-muted-foreground mb-8 text-sm'>
        <Link href='/' className='underline underline-offset-4'>
          RevCollect
        </Link>
      </p>
      <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
      <div className='text-muted-foreground mt-6 space-y-4 text-sm leading-relaxed'>{children}</div>
    </main>
  );
}
