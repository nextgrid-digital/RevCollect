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
      title='When to escalate to you'
      description='Tell the agent when to flag invoices for your attention instead of drafting another follow-up.'
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
