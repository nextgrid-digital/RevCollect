'use client';

import type { ReactNode } from 'react';
import { SettingsCenterPeek } from '@/features/revcollect/settings/components/settings-center-peek';
import { SettingsPeekProvider } from '@/features/revcollect/settings/components/settings-peek-context';

export function AppSettingsShell({ children }: { children: ReactNode }) {
  return (
    <SettingsPeekProvider>
      {children}
      <SettingsCenterPeek />
    </SettingsPeekProvider>
  );
}
