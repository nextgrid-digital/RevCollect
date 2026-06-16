'use client';

import { parseAsStringEnum, useQueryState } from 'nuqs';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

export const SETTINGS_TABS = ['general', 'appearance', 'integrations', 'billing'] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

const settingsTabParser = parseAsStringEnum([...SETTINGS_TABS]);

interface SettingsPeekContextValue {
  tab: SettingsTab;
  isOpen: boolean;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setTab: (tab: SettingsTab) => void;
}

const SettingsPeekContext = createContext<SettingsPeekContextValue | null>(null);

const DEFAULT_TAB: SettingsTab = 'general';

export function SettingsPeekProvider({ children }: { children: ReactNode }) {
  const [settingsTab, setSettingsTab] = useQueryState(
    'settings',
    settingsTabParser.withOptions({ shallow: true })
  );

  const tab = settingsTab ?? DEFAULT_TAB;
  const isOpen = settingsTab !== null;

  const openSettings = useCallback(
    (nextTab: SettingsTab = DEFAULT_TAB) => {
      void setSettingsTab(nextTab);
    },
    [setSettingsTab]
  );

  const closeSettings = useCallback(() => {
    void setSettingsTab(null);
  }, [setSettingsTab]);

  const setTab = useCallback(
    (nextTab: SettingsTab) => {
      void setSettingsTab(nextTab);
    },
    [setSettingsTab]
  );

  const value = useMemo(
    () => ({
      tab,
      isOpen,
      openSettings,
      closeSettings,
      setTab
    }),
    [tab, isOpen, openSettings, closeSettings, setTab]
  );

  return <SettingsPeekContext.Provider value={value}>{children}</SettingsPeekContext.Provider>;
}

export function useSettingsPeek() {
  const context = useContext(SettingsPeekContext);
  if (!context) {
    throw new Error('useSettingsPeek must be used within SettingsPeekProvider');
  }
  return context;
}

export function settingsTabFromPath(path: string): SettingsTab | null {
  switch (path) {
    case '/settings':
      return 'general';
    case '/settings/appearance':
      return 'appearance';
    case '/settings/integrations':
      return 'integrations';
    case '/settings/billing':
      return 'billing';
    default:
      return null;
  }
}
