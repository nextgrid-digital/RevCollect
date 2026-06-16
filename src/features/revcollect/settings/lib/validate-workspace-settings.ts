import type { WorkspaceGeneralSettings } from '../../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface WorkspaceSettingsValidation {
  isValid: boolean;
  reminderSequenceError?: string;
  primaryContactEmailError?: string;
  replyToEmailError?: string;
}

export function validateWorkspaceGeneralSettings(
  settings: WorkspaceGeneralSettings
): WorkspaceSettingsValidation {
  const { reminderSequence } = settings;
  const reminders = [
    reminderSequence.firstReminderDays,
    reminderSequence.secondReminderDays,
    reminderSequence.thirdReminderDays,
    reminderSequence.finalNoticeDays
  ];

  let reminderSequenceError: string | undefined;
  if (reminders.some((value) => !Number.isFinite(value) || value < 0)) {
    reminderSequenceError = 'Reminder days must be zero or greater.';
  } else if (
    reminderSequence.firstReminderDays >= reminderSequence.secondReminderDays ||
    reminderSequence.secondReminderDays >= reminderSequence.thirdReminderDays ||
    reminderSequence.thirdReminderDays >= reminderSequence.finalNoticeDays
  ) {
    reminderSequenceError =
      'Each reminder step must come after the previous one (e.g. 7, 14, 21, 30 days).';
  }

  let primaryContactEmailError: string | undefined;
  if (!EMAIL_PATTERN.test(settings.primaryContactEmail.trim())) {
    primaryContactEmailError = 'Enter a valid email address.';
  }

  let replyToEmailError: string | undefined;
  if (!EMAIL_PATTERN.test(settings.replyToEmail.trim())) {
    replyToEmailError = 'Enter a valid reply-to address.';
  }

  return {
    isValid: !reminderSequenceError && !primaryContactEmailError && !replyToEmailError,
    reminderSequenceError,
    primaryContactEmailError,
    replyToEmailError
  };
}
