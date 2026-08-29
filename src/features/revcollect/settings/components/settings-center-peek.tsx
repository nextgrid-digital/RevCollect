'use client';

import { Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SETTINGS_TABS, type SettingsTab, useSettingsPeek } from './settings-peek-context';
import { SettingsAppearanceView } from './settings-appearance-view';
import { SettingsBillingView } from './settings-billing-view';
import { SettingsGeneralView } from './settings-general-view';
import { SettingsIntegrationsView } from './settings-integrations-view';

const NAV_ITEMS: { tab: SettingsTab; label: string }[] = [
  { tab: 'general', label: 'General' },
  { tab: 'appearance', label: 'Appearance' },
  { tab: 'integrations', label: 'Integrations' },
  { tab: 'billing', label: 'Billing' }
];

function SettingsPeekContent({ tab }: { tab: SettingsTab }) {
  switch (tab) {
    case 'general':
      return <SettingsGeneralView />;
    case 'appearance':
      return <SettingsAppearanceView />;
    case 'integrations':
      return (
        <Suspense fallback={<p className='text-muted-foreground text-sm'>Loading integrations…</p>}>
          <SettingsIntegrationsView />
        </Suspense>
      );
    case 'billing':
      return <SettingsBillingView />;
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

export function SettingsCenterPeek() {
  const { tab, isOpen, closeSettings, setTab } = useSettingsPeek();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className='flex h-[85vh] max-h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-5xl'>
        <DialogHeader className='sr-only'>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Workspace and account preferences</DialogDescription>
        </DialogHeader>

        <div className='flex min-h-0 flex-1 flex-col md:flex-row'>
          <nav
            className='border-border/60 bg-sidebar text-sidebar-foreground flex shrink-0 flex-row gap-1 overflow-x-auto border-b px-3 py-3 md:w-52 md:flex-col md:gap-0 md:overflow-visible md:border-r md:border-b-0 md:py-4'
            aria-label='Settings sections'
          >
            <p className='text-sidebar-foreground hidden px-2 pb-3 text-sm font-semibold md:block'>
              Settings
            </p>
            <p className='text-muted-foreground hidden px-2 pb-1 text-xs font-medium md:block'>
              Workspace
            </p>
            <ul className='flex gap-1 md:flex-col md:gap-0.5'>
              {NAV_ITEMS.map((item) => (
                <li key={item.tab} className='shrink-0 md:shrink'>
                  <button
                    type='button'
                    onClick={() => setTab(item.tab)}
                    aria-current={tab === item.tab ? 'page' : undefined}
                    className={cn(
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground inline-flex rounded-md px-3 py-1.5 text-sm transition-colors md:block md:w-full md:px-2',
                      tab === item.tab &&
                        'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className='min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'>
            <SettingsPeekContent tab={tab} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function isSettingsTab(value: string): value is SettingsTab {
  return (SETTINGS_TABS as readonly string[]).includes(value);
}
