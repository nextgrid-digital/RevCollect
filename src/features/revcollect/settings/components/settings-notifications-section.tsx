'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { WorkspaceGeneralSettings } from '../../types';
import { SettingsCard } from './settings-card';

interface NotificationRowProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function NotificationRow({
  id,
  title,
  description,
  checked,
  onCheckedChange
}: NotificationRowProps) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='min-w-0 space-y-0.5'>
        <Label htmlFor={id} className='text-sm font-medium'>
          {title}
        </Label>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

interface SettingsNotificationsSectionProps {
  settings: WorkspaceGeneralSettings;
  onChange: (patch: Partial<WorkspaceGeneralSettings>) => void;
}

export function SettingsNotificationsSection({
  settings,
  onChange
}: SettingsNotificationsSectionProps) {
  const updateNotification = (
    key: keyof WorkspaceGeneralSettings['notifications'],
    value: boolean
  ) => {
    onChange({
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    });
  };

  return (
    <SettingsCard title='Notifications'>
      <div className='divide-border divide-y'>
        <div className='pb-4'>
          <NotificationRow
            id='notify-payment-received'
            title='Payment received'
            description='Get notified when a tracked invoice is paid'
            checked={settings.notifications.paymentReceived}
            onCheckedChange={(value) => updateNotification('paymentReceived', value)}
          />
        </div>
        <div className='py-4'>
          <NotificationRow
            id='notify-customer-replied'
            title='Customer replied'
            description='Get notified when a customer responds to a follow-up'
            checked={settings.notifications.customerReplied}
            onCheckedChange={(value) => updateNotification('customerReplied', value)}
          />
        </div>
        <div className='py-4'>
          <NotificationRow
            id='notify-invoice-overdue'
            title='Invoice overdue'
            description='Get notified when an invoice crosses 30 days overdue'
            checked={settings.notifications.invoiceOverdue}
            onCheckedChange={(value) => updateNotification('invoiceOverdue', value)}
          />
        </div>
        <div className='pt-4'>
          <NotificationRow
            id='notify-weekly-summary'
            title='Weekly summary'
            description='Weekly email with AR overview and DSO trends'
            checked={settings.notifications.weeklySummary}
            onCheckedChange={(value) => updateNotification('weeklySummary', value)}
          />
        </div>
      </div>
    </SettingsCard>
  );
}
