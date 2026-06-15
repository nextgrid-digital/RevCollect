'use client';

import { ThemeModeSetting } from '@/components/themes/theme-mode-setting';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { SettingsSection } from './settings-section';

export function SettingsAppearanceSection() {
  return (
    <SettingsSection title='Appearance' className='py-6'>
      <div className='space-y-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6'>
          <ThemeModeSetting variant='settings' className='min-w-0 flex-1' />
          <ThemeSelector
            id='settings-theme-selector'
            showShortcut={false}
            variant='settings'
            className='min-w-0 flex-1'
          />
        </div>
        <p className='text-muted-foreground text-sm'>
          Keyboard shortcuts <kbd className='font-mono text-xs'>D D</kbd> and{' '}
          <kbd className='font-mono text-xs'>T T</kbd> still work from the command palette.
        </p>
      </div>
    </SettingsSection>
  );
}
