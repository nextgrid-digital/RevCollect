import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'RevCollect',
  description: 'Drafts you send. Your books stay the books. Gmail is the mail.'
};

export default function LaunchPage() {
  return (
    <main className='mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-6 py-16'>
      <h1 className='text-3xl font-semibold tracking-tight'>RevCollect</h1>
      <p className='text-muted-foreground text-sm leading-relaxed'>
        Collections inbox for bookkeepers. Drafts, you send. Xero, QuickBooks Online, or Zoho Books
        stay the books. Gmail is the mail. We do not auto-email your clients.
      </p>
      <div className='flex flex-wrap gap-2'>
        <Button asChild>
          <Link href='/signup'>Start</Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/login'>Sign in</Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/onboarding/connect-quickbooks'>Connect QuickBooks</Link>
        </Button>
      </div>
    </main>
  );
}
