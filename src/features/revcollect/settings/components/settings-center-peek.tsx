'use client';

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
      return <SettingsIntegrationsView />;
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

        <div className='flex min-h-0 flex-1'>
          <nav
            className='bg-sidebar text-sidebar-foreground border-border/60 flex w-52 shrink-0 flex-col border-r px-3 py-4'
            aria-label='Settings sections'
          >
            <p className='text-sidebar-foreground px-2 pb-3 text-sm font-semibold'>Settings</p>
            <p className='text-muted-foreground px-2 pb-1 text-xs font-medium'>Workspace</p>
            <ul className='space-y-0.5'>
              {NAV_ITEMS.map((item) => (
                <li key={item.tab}>
                  <button
                    type='button'
                    onClick={() => setTab(item.tab)}
                    aria-current={tab === item.tab ? 'page' : undefined}
                    className={cn(
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
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

          <div className='min-h-0 flex-1 overflow-y-auto p-6'>
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
