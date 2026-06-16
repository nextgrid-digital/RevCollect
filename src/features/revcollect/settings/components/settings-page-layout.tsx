'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { cn } from '@/lib/utils';
import { workspaceListWidth } from '@/features/revcollect/lib/workspace-layout';
import { MotionFade } from '@/features/revcollect/motion/motion-primitives';
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
  const activeNavItem = NAV_ITEMS.find((item) => item.tab === tab);
  const mobileBreadcrumbs =
    tab === 'general'
      ? undefined
      : [{ label: 'Settings', href: '/settings' }, { label: activeNavItem?.label ?? 'Settings' }];

  return (
    <WorkspaceCanvas className='flex-col md:flex-row'>
      <div className={cn('hidden min-h-0 flex-col gap-2 md:flex', workspaceListWidth)}>
        <WorkspacePageTitle title='Settings' className='h-8' />
        <WorkspaceCard variant='list' className='min-h-0 w-full flex-1'>
          <nav
            className='scroll-stable flex min-h-0 flex-1 flex-col overflow-y-auto p-3'
            aria-label='Settings sections'
          >
            <p className='text-sidebar-foreground/70 px-2 pb-2 text-xs font-medium tracking-wide uppercase'>
              Workspace
            </p>
            <ul className='space-y-0.5'>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.tab}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'block rounded-md px-2 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </WorkspaceCard>
      </div>

      <div className='flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden md:hidden'>
        <WorkspacePageTitle
          className='h-8 shrink-0'
          title={tab === 'general' ? 'Settings' : undefined}
          breadcrumbs={mobileBreadcrumbs}
        />
        <nav
          className='border-sidebar-border flex shrink-0 gap-1 overflow-x-auto border-b pb-3 whitespace-nowrap'
          aria-label='Settings sections'
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.tab}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-7 shrink-0 items-center rounded-md px-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className='scroll-stable flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
        <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
          <div className='mx-auto w-full max-w-3xl space-y-6 py-4 md:py-0'>
            <MotionFade show motionKey={tab}>
              <SettingsPageContent tab={tab} />
            </MotionFade>
          </div>
        </div>
      </div>
    </WorkspaceCanvas>
  );
}
