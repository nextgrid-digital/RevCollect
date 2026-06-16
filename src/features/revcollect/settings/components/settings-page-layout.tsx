'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SettingsAppearanceView } from './settings-appearance-view';
import { SettingsBillingView } from './settings-billing-view';
import { SettingsGeneralView } from './settings-general-view';
import { SettingsIntegrationsView } from './settings-integrations-view';
import type { SettingsTab } from './settings-peek-context';

const NAV_ITEMS: { tab: SettingsTab; label: string; href: string }[] = [
  { tab: 'general', label: 'General', href: '/settings' },
  { tab: 'appearance', label: 'Appearance', href: '/settings/appearance' },
  { tab: 'integrations', label: 'Integrations', href: '/settings/integrations' },
  { tab: 'billing', label: 'Billing', href: '/settings/billing' }
];

function SettingsPageContent({ tab }: { tab: SettingsTab }) {
  switch (tab) {
    case 'general':
      return <SettingsGeneralView />;
    case 'appearance':
      return <SettingsAppearanceView />;
    case 'integrations':
      return <SettingsIntegrationsView />;
    case 'billing':
      return (
        <Suspense fallback={<p className='text-muted-foreground text-sm'>Loading billing…</p>}>
          <SettingsBillingView />
        </Suspense>
      );
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

interface SettingsPageLayoutProps {
  tab: SettingsTab;
}

export function SettingsPageLayout({ tab }: SettingsPageLayoutProps) {
  const pathname = usePathname();

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-6 md:flex-row md:gap-0'>
      <nav
        className='border-border/60 bg-background sticky top-0 z-10 flex shrink-0 flex-row gap-1 overflow-x-auto border-b pb-4 md:w-52 md:flex-col md:gap-0 md:overflow-visible md:self-start md:border-r md:border-b-0 md:pb-0 md:pr-4'
        aria-label='Settings sections'
      >
        <p className='text-foreground hidden px-2 pb-3 text-sm font-semibold md:block'>Settings</p>
        <p className='text-muted-foreground hidden px-2 pb-1 text-xs font-medium md:block'>
          Workspace
        </p>
        <ul className='flex gap-1 md:flex-col md:gap-0.5'>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.tab}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'hover:bg-muted inline-flex rounded-md px-3 py-1.5 text-sm transition-colors md:block md:w-full md:px-2',
                    isActive && 'bg-muted text-foreground font-medium'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto md:pl-6'>
        <SettingsPageContent tab={tab} />
      </div>
    </div>
  );
}
