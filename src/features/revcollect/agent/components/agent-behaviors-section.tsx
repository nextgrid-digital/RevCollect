'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AgentBehaviors } from '../../types';
import { SettingsSection } from '../../settings/components/settings-section';

type AgentBehaviorToggleKey = Exclude<keyof AgentBehaviors, 'digestHour'>;

function formatDigestHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

function digestHourToTimeValue(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function timeValueToDigestHour(value: string): number {
  const [hours] = value.split(':');
  const parsed = Number.parseInt(hours ?? '7', 10);
  if (Number.isNaN(parsed)) return 7;
  return Math.min(Math.max(parsed, 0), 23);
}

const BEHAVIOR_GROUPS: {
  label: string;
  rows: {
    key: AgentBehaviorToggleKey;
    label: string;
    description: string | ((behaviors: AgentBehaviors) => string);
  }[];
}[] = [
  {
    label: 'Drafting',
    rows: [
      {
        key: 'autoDraftFollowUps',
        label: 'Auto-draft follow-ups',
        description: 'Prepare drafts when invoices hit the urgency bands above.'
      },
      {
        key: 'autoClassifyEmails',
        label: 'Auto-classify incoming emails',
        description: 'Tag replies as promise, dispute, or deflection.'
      }
    ]
  },
  {
    label: 'Follow-ups',
    rows: [
      {
        key: 'promiseTracking',
        label: 'Promise tracking',
        description: 'Auto-set follow-up when a promised payment date passes.'
      },
      {
        key: 'earlyPaymentDiscount',
        label: 'Early payment discount',
        description: 'Offer 2% discount for payment within 10 days.'
      }
    ]
  },
  {
    label: 'Notifications',
    rows: [
      {
        key: 'dailyDigest',
        label: 'Daily digest email',
        description: (behaviors) =>
          `Summary of actions needed, sent at ${formatDigestHour(behaviors.digestHour)}.`
      },
      {
        key: 'escalationAlerts',
        label: 'Escalation alerts',
        description: 'Notify you when follow-ups are ignored or deflected.'
      }
    ]
  }
];

interface AgentBehaviorsSectionProps {
  behaviors: AgentBehaviors;
  onChange: (behaviors: AgentBehaviors) => void;
}

export function AgentBehaviorsSection({ behaviors, onChange }: AgentBehaviorsSectionProps) {
  return (
    <SettingsSection
      title='What the agent does'
      description='Turn capabilities on or off. Drafts still require your approval before sending.'
    >
      <div className='space-y-6'>
        {BEHAVIOR_GROUPS.map((group) => (
          <div key={group.label} className='space-y-2'>
            <p className='text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase'>
              {group.label}
            </p>
            <ul className='divide-border divide-y rounded-lg border'>
              {group.rows.map((row) => {
                const inputId = `agent-behavior-${row.key}`;
                const description =
                  typeof row.description === 'function'
                    ? row.description(behaviors)
                    : row.description;

                return (
                  <li key={row.key} className='px-3 py-3'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='min-w-0'>
                        <Label htmlFor={inputId} className='text-sm font-medium'>
                          {row.label}
                        </Label>
                        <p className='text-muted-foreground mt-0.5 text-xs leading-relaxed'>
                          {description}
                        </p>
                      </div>
                      <Switch
                        id={inputId}
                        checked={behaviors[row.key]}
                        onCheckedChange={(checked) =>
                          onChange({ ...behaviors, [row.key]: checked })
                        }
                      />
                    </div>
                    {row.key === 'dailyDigest' && behaviors.dailyDigest ? (
                      <div className='mt-3 flex items-center gap-2'>
                        <Label
                          htmlFor='agent-digest-time'
                          className='text-muted-foreground text-xs'
                        >
                          Send at
                        </Label>
                        <input
                          id='agent-digest-time'
                          type='time'
                          value={digestHourToTimeValue(behaviors.digestHour)}
                          onChange={(e) =>
                            onChange({
                              ...behaviors,
                              digestHour: timeValueToDigestHour(e.target.value)
                            })
                          }
                          className='border-input bg-background h-8 rounded-md border px-2 text-sm'
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
