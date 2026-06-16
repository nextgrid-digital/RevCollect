'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUpdateWorkspaceGeneralSettings, useWorkspaceGeneralSettings } from '../../api/queries';
import type { WorkspaceGeneralSettings } from '../../types';
import { validateWorkspaceGeneralSettings } from '../lib/validate-workspace-settings';
import { SettingsCompanySection } from './settings-company-section';
import { SettingsEmailSenderSection } from './settings-email-sender-section';
import { SettingsGeneralFooter } from './settings-general-footer';
import { SettingsNotificationsSection } from './settings-notifications-section';
import { SettingsPrivacySection } from './settings-privacy-section';
import { SettingsReminderSequenceSection } from './settings-reminder-sequence-section';

function settingsEqual(a: WorkspaceGeneralSettings, b: WorkspaceGeneralSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function SettingsGeneralView() {
  const { data: savedSettings, isPending } = useWorkspaceGeneralSettings();
  const updateSettings = useUpdateWorkspaceGeneralSettings();
  const [draft, setDraft] = useState<WorkspaceGeneralSettings | null>(null);

  useEffect(() => {
    if (savedSettings) {
      setDraft(structuredClone(savedSettings));
    }
  }, [savedSettings]);

  const validation = useMemo(
    () => (draft ? validateWorkspaceGeneralSettings(draft) : { isValid: false }),
    [draft]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !savedSettings) return false;
    return !settingsEqual(draft, savedSettings);
  }, [draft, savedSettings]);

  const handleChange = (patch: Partial<WorkspaceGeneralSettings>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleCancel = () => {
    if (savedSettings) {
      setDraft(structuredClone(savedSettings));
    }
  };

  const handleSave = () => {
    if (!draft || !validation.isValid) return;
    updateSettings.mutate(draft);
  };

  if (isPending || !draft) {
    return <p className='text-muted-foreground text-sm'>Loading settings…</p>;
  }

  return (
    <div className='space-y-6 pb-2'>
      <SettingsCompanySection
        settings={draft}
        onChange={handleChange}
        primaryContactEmailError={validation.primaryContactEmailError}
      />
      <SettingsReminderSequenceSection
        settings={draft}
        onChange={handleChange}
        error={validation.reminderSequenceError}
      />
      <SettingsEmailSenderSection
        settings={draft}
        onChange={handleChange}
        replyToEmailError={validation.replyToEmailError}
      />
      <SettingsNotificationsSection settings={draft} onChange={handleChange} />
      <SettingsPrivacySection />
      <SettingsGeneralFooter
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={updateSettings.isPending}
        canSave={validation.isValid}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  );
}
