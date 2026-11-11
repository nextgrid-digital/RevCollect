import type { WorkspaceGeneralSettings } from '../../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface WorkspaceSettingsValidation {
  isValid: boolean;
  primaryContactEmailError?: string;
  replyToEmailError?: string;
}

export function validateWorkspaceGeneralSettings(
  settings: WorkspaceGeneralSettings
): WorkspaceSettingsValidation {
  let primaryContactEmailError: string | undefined;
  if (!EMAIL_PATTERN.test(settings.primaryContactEmail.trim())) {
    primaryContactEmailError = 'Enter a valid email address.';
  }

  let replyToEmailError: string | undefined;
  if (!EMAIL_PATTERN.test(settings.replyToEmail.trim())) {
    replyToEmailError = 'Enter a valid reply-to address.';
  }

  return {
    isValid: !primaryContactEmailError && !replyToEmailError,
    primaryContactEmailError,
    replyToEmailError
  };
}
