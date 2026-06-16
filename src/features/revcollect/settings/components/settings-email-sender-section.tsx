'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { WorkspaceGeneralSettings } from '../../types';
import { SettingsCard } from './settings-card';

interface SettingsEmailSenderSectionProps {
  settings: WorkspaceGeneralSettings;
  onChange: (patch: Partial<WorkspaceGeneralSettings>) => void;
  replyToEmailError?: string;
}

export function SettingsEmailSenderSection({
  settings,
  onChange,
  replyToEmailError
}: SettingsEmailSenderSectionProps) {
  return (
    <SettingsCard title='Email sender'>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='send-from-name'>Send-from name</Label>
          <Input
            id='send-from-name'
            value={settings.sendFromName}
            onChange={(e) => onChange({ sendFromName: e.target.value })}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='reply-to-email'>Reply-to address</Label>
          <Input
            id='reply-to-email'
            type='email'
            value={settings.replyToEmail}
            onChange={(e) => onChange({ replyToEmail: e.target.value })}
            aria-invalid={Boolean(replyToEmailError)}
          />
          {replyToEmailError ? (
            <p className='text-destructive text-sm'>{replyToEmailError}</p>
          ) : null}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='email-signature'>Email signature</Label>
          <Textarea
            id='email-signature'
            value={settings.emailSignature}
            onChange={(e) => onChange({ emailSignature: e.target.value })}
            rows={5}
            className='resize-y font-mono text-sm'
          />
        </div>
      </div>
    </SettingsCard>
  );
}
