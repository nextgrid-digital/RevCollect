'use client';

import { Textarea } from '@/components/ui/textarea';
import { SettingsSection } from '../../settings/components/settings-section';

interface AgentSignatureSectionProps {
  value: string;
  onChange: (signature: string) => void;
}

export function AgentSignatureSection({ value, onChange }: AgentSignatureSectionProps) {
  return (
    <SettingsSection title='Email signature' description='Appended to every AI draft in Inbox.'>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className='resize-y font-mono text-sm'
        aria-label='Email signature'
      />
    </SettingsSection>
  );
}
