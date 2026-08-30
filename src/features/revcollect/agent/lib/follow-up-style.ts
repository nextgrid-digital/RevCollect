import type { AgentConfig, AgentFollowUpStyle } from '../../types';

export const FOLLOW_UP_STYLE_OPTIONS: {
  id: AgentFollowUpStyle;
  label: string;
  description: string;
  tone: AgentConfig['tone'];
}[] = [
  {
    id: 'gentle',
    label: 'Gentle',
    description: 'Friendly reminder — good for long-term customers',
    tone: 'friendly'
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Clear and professional — most accounts',
    tone: 'professional'
  },
  {
    id: 'assertive',
    label: 'Assertive',
    description: 'Direct, with a due date — accounts that ignore reminders',
    tone: 'firm'
  }
];

export const FOLLOW_UP_STYLE_SAMPLES: Record<
  AgentFollowUpStyle,
  { subject: string; body: string }
> = {
  gentle: {
    subject: 'Friendly reminder: invoice INV-1042',
    body: `Hi Sam,

Just a note that invoice INV-1042 for $1,240 was due on 12 March. If you have already paid, thank you — you can ignore this.

If anything is unclear, I am happy to help.

Thanks so much,`
  },
  balanced: {
    subject: 'Invoice INV-1042 is overdue',
    body: `Hi Sam,

Invoice INV-1042 for $1,240 was due on 12 March and is now overdue. Please arrange payment at your earliest convenience.

Let us know if you need a copy of the invoice or have a question.

Kind regards,`
  },
  assertive: {
    subject: 'Action needed: INV-1042 is 21 days overdue',
    body: `Hi Sam,

Invoice INV-1042 for $1,240 is 21 days past due. Please pay by Friday 4 April to bring the account current.

If payment is not received, we may pause further work until the balance is cleared.

Regards,`
  }
};

export function followUpStyleLabel(style: AgentFollowUpStyle): string {
  return FOLLOW_UP_STYLE_OPTIONS.find((option) => option.id === style)?.label ?? 'Balanced';
}

export function followUpStyleToTone(style: AgentFollowUpStyle): AgentConfig['tone'] {
  return FOLLOW_UP_STYLE_OPTIONS.find((option) => option.id === style)?.tone ?? 'professional';
}

export function toneToFollowUpStyle(tone: AgentConfig['tone']): AgentFollowUpStyle {
  const match = FOLLOW_UP_STYLE_OPTIONS.find((option) => option.tone === tone);
  return match?.id ?? 'balanced';
}

export function syncAgentConfigTone(config: AgentConfig): AgentConfig {
  return {
    ...config,
    tone: followUpStyleToTone(config.followUpStyle)
  };
}
