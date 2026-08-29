import type {
  AgentAddonStatus,
  AgentConfig,
  WorkspaceGeneralSettings
} from '@/features/revcollect/types';
import { DEFAULT_WORKSPACE_GENERAL_SETTINGS } from '@/features/revcollect/settings/lib/workspace-settings-defaults';
import type { CanonicalSnapshot, CustomerIntelligence, CustomerPatterns } from './types';

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  tone: 'professional',
  followUpStyle: 'balanced',
  isActive: false,
  riskThresholds: {
    healthyDays: [0, 7],
    watchDays: [8, 15],
    urgentDays: [16, 30],
    criticalDaysMin: 30
  },
  customerOverrides: [],
  behaviors: {
    earlyPaymentDiscount: false,
    autoClassifyEmails: true,
    promiseTracking: true,
    dailyDigest: true,
    autoDraftFollowUps: true,
    escalationAlerts: true,
    digestHour: 7
  },
  digestPreview: {
    dateLabel: '',
    bullets: []
  },
  autoSendEnabled: false,
  escalationRules:
    'Escalate to human review when balance exceeds $25,000, customer is in dispute, or no reply after 3 touches.',
  signature: 'Best regards,\nRevCollect Collections Team'
};

export const DEFAULT_ADDON_STATUS: AgentAddonStatus = {
  subscribed: false,
  priceMonthlyCents: 3900,
  estimatedAiCostMonthlyCents: 400
};

export function emptyPatterns(): CustomerPatterns {
  return {
    avgDso: 0,
    trend: 'stable',
    paysAfterFollowupN: null,
    seasonal: null,
    onTimeRate: 0,
    avgResponseHours: null
  };
}

export function emptyIntelligence(): CustomerIntelligence {
  return {
    patterns: emptyPatterns(),
    situations: [],
    preferences: {},
    relationshipState: 'normal',
    installmentHistory: []
  };
}

export function emptySnapshot(): CanonicalSnapshot {
  return {
    customers: [],
    invoices: [],
    payments: [],
    intelligenceByCustomerId: {},
    drafts: [],
    inboxMessages: [],
    agentConfig: null,
    ariRuns: [],
    workspaceSettings: null,
    agentAddonStatus: null,
    ingestedAt: null
  };
}

export function defaultWorkspaceAgentConfig(base: AgentConfig = DEFAULT_AGENT_CONFIG): AgentConfig {
  return {
    ...base,
    autoSendEnabled: false,
    digestPreview: base.digestPreview ?? {
      dateLabel: '',
      bullets: []
    }
  };
}

export function defaultAddonStatus(): AgentAddonStatus {
  return { ...DEFAULT_ADDON_STATUS };
}

export function defaultWorkspaceSettings(): WorkspaceGeneralSettings {
  return structuredClone(DEFAULT_WORKSPACE_GENERAL_SETTINGS);
}
