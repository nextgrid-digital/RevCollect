import type { ReactNode } from 'react';
import { MarketingFooter } from './marketing-footer';
import { MarketingHeader } from './marketing-header';

interface MarketingPageShellProps {
  children: ReactNode;
}

export function MarketingPageShell({ children }: MarketingPageShellProps) {
  return (
    <div className='bg-background flex min-h-screen flex-col'>
      <MarketingHeader />
      <main className='flex-1'>{children}</main>
      <MarketingFooter />
    </div>
  );
}
