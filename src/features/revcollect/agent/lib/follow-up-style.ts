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
    description: 'Friendly tone, soft reminders, relationship-first.',
    tone: 'friendly'
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Professional, clear expectations, firm but polite.',
    tone: 'professional'
  },
  {
    id: 'assertive',
    label: 'Assertive',
    description: 'Direct, deadline-driven, consequences mentioned.',
    tone: 'firm'
  }
];

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
