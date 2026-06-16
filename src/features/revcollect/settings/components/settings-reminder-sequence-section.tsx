'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WorkspaceGeneralSettings } from '../../types';
import { SettingsCard } from './settings-card';

interface SettingsReminderSequenceSectionProps {
  settings: WorkspaceGeneralSettings;
  onChange: (patch: Partial<WorkspaceGeneralSettings>) => void;
  error?: string;
}

interface ReminderFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function ReminderField({ id, label, value, onChange }: ReminderFieldProps) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <div className='flex items-center gap-2'>
        <Input
          id={id}
          type='number'
          min={0}
          inputMode='numeric'
          className='w-20'
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className='text-muted-foreground text-sm'>days after due</span>
      </div>
    </div>
  );
}

export function SettingsReminderSequenceSection({
  settings,
  onChange,
  error
}: SettingsReminderSequenceSectionProps) {
  const updateReminder = (
    key: keyof WorkspaceGeneralSettings['reminderSequence'],
    value: number
  ) => {
    onChange({
      reminderSequence: {
        ...settings.reminderSequence,
        [key]: value
      }
    });
  };

  return (
    <SettingsCard
      title='Reminder sequence'
      description='Default follow-up timing after invoice due date. Customizable per customer with Agent.'
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <ReminderField
          id='first-reminder-days'
          label='1st reminder'
          value={settings.reminderSequence.firstReminderDays}
          onChange={(value) => updateReminder('firstReminderDays', value)}
        />
        <ReminderField
          id='second-reminder-days'
          label='2nd reminder'
          value={settings.reminderSequence.secondReminderDays}
          onChange={(value) => updateReminder('secondReminderDays', value)}
        />
        <ReminderField
          id='third-reminder-days'
          label='3rd reminder'
          value={settings.reminderSequence.thirdReminderDays}
          onChange={(value) => updateReminder('thirdReminderDays', value)}
        />
        <ReminderField
          id='final-notice-days'
          label='Final notice'
          value={settings.reminderSequence.finalNoticeDays}
          onChange={(value) => updateReminder('finalNoticeDays', value)}
        />
      </div>
      {error ? <p className='text-destructive text-sm'>{error}</p> : null}
    </SettingsCard>
  );
}
