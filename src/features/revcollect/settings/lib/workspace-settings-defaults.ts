import type { WorkspaceGeneralSettings } from '../../types';

export const DEFAULT_WORKSPACE_GENERAL_SETTINGS: WorkspaceGeneralSettings = {
  companyName: "Vaidhy's Consulting LLC",
  industry: 'professional_services',
  primaryContactEmail: 'vaidhy@revcollect.ai',
  timezone: 'America/New_York',
  reminderSequence: {
    firstReminderDays: 7,
    secondReminderDays: 14,
    thirdReminderDays: 21,
    finalNoticeDays: 30
  },
  sendFromName: "Vaidhy's Consulting — Billing",
  replyToEmail: 'billing@vaidhyconsulting.com',
  emailSignature: "Best regards,\nVaidhy R\nVaidhy's Consulting LLC\nbilling@vaidhyconsulting.com",
  notifications: {
    paymentReceived: true,
    customerReplied: true,
    invoiceOverdue: true,
    weeklySummary: false
  }
};
