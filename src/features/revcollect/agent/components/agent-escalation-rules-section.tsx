'use client';

import { Textarea } from '@/components/ui/textarea';
import { SettingsSection } from '../../settings/components/settings-section';

interface AgentEscalationRulesSectionProps {
  value: string;
  onChange: (rules: string) => void;
}

export function AgentEscalationRulesSection({ value, onChange }: AgentEscalationRulesSectionProps) {
  return (
    <SettingsSection
      title='When to stop chasing and ask you'
      description='Tell RevCollect when to flag invoices for you instead of drafting another reminder.'
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className='resize-y text-sm'
        aria-label='Escalation rules'
      />
    </SettingsSection>
  );
}
