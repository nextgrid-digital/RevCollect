import Link from 'next/link';
import { Icons } from '@/components/icons';
import { marketingFooterLinks } from '../data/marketing-nav';

export function MarketingFooter() {
  return (
    <footer className='border-border/60 border-t px-4 py-10 sm:px-6'>
      <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md'>
            <Icons.logo className='size-3.5' />
          </div>
          <span className='text-sm font-medium'>RevCollect</span>
        </div>
        <nav className='flex flex-wrap items-center justify-center gap-x-5 gap-y-2'>
          {marketingFooterLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='text-muted-foreground hover:text-foreground text-sm transition-colors'
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className='text-muted-foreground text-sm'>© {new Date().getFullYear()} Nextgrid Digital</p>
      </div>
    </footer>
  );
}
