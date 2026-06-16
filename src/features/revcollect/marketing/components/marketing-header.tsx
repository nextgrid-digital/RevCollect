import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { marketingNavLinks } from '../data/marketing-nav';

export function MarketingHeader() {
  return (
    <header className='border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md'>
      <div className='mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6'>
        <Link href='/' className='flex items-center gap-2.5'>
          <div className='bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg'>
            <Icons.logo className='size-4' />
          </div>
          <span className='text-sm font-semibold tracking-tight'>RevCollect</span>
        </Link>

        <nav className='hidden items-center gap-6 lg:flex'>
          {marketingNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='text-muted-foreground hover:text-foreground text-sm transition-colors'
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className='flex items-center gap-2'>
          <Button asChild variant='ghost' size='sm' className='hidden sm:inline-flex'>
            <Link href='/inbox'>View demo</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href='/waitlist'>Join waitlist</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
