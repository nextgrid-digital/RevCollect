import type {
  AgentAddonStatus,
  AgentConfig,
  Customer,
  InboxMessage,
  Invoice,
  ThreadEmail,
  WorkspaceGeneralSettings
} from '@/features/revcollect/types';

export type RelationshipState = 'normal' | 'sensitive' | 'paused';
export type SituationStatus = 'active' | 'retired';
export type PatternTrend = 'improving' | 'stable' | 'worsening';

export interface CustomerPatterns {
  avgDso: number;
  trend: PatternTrend;
  paysAfterFollowupN: number | null;
  seasonal: string | null;
  onTimeRate: number;
  avgResponseHours: number | null;
}

export interface CustomerSituation {
  flag: string;
  detail?: string;
  evidence: string;
  confidence: number;
  created: string;
  expires: string;
  status: SituationStatus;
  retireOn?: string;
}

export interface CustomerPreferences {
  greeting?: string;
  signoff?: string;
  neverMention?: string[];
  toneOverride?: string;
}

export interface InstallmentHistoryEntry {
  date: string;
  honored: boolean;
}

export interface CustomerIntelligence {
  patterns: CustomerPatterns;
  situations: CustomerSituation[];
  preferences: CustomerPreferences;
  relationshipState: RelationshipState;
  installmentHistory: InstallmentHistoryEntry[];
}

export interface CanonicalPayment {
  id: string;
  customerId: string;
  invoiceId?: string;
  amountCents: number;
  paidAt: string;
  externalId?: string;
}

export interface AgentDraftRecord {
  id: string;
  threadId: string;
  customerId: string;
  title: string;
  body: string;
  tone: string;
  preparedAt: string;
}

export interface AriRunRecord {
  id: string;
  ranAt: string;
  hourLabel: string;
  bullets: string[];
}

export interface CanonicalSnapshot {
  customers: Customer[];
  invoices: Invoice[];
  payments: CanonicalPayment[];
  intelligenceByCustomerId: Record<string, CustomerIntelligence>;
  drafts: AgentDraftRecord[];
  sentEmails: ThreadEmail[];
  inboxMessages: InboxMessage[];
  agentConfig: AgentConfig | null;
  ariRuns: AriRunRecord[];
  workspaceSettings: WorkspaceGeneralSettings | null;
  agentAddonStatus: AgentAddonStatus | null;
  ingestedAt: string | null;
}

export interface CanonicalStore {
  read(tenantId: string): Promise<CanonicalSnapshot>;
  write(tenantId: string, snapshot: CanonicalSnapshot): Promise<void>;
  replaceAr(
    tenantId: string,
    payload: {
      customers: Customer[];
      invoices: Invoice[];
      payments: CanonicalPayment[];
      inboxMessages: InboxMessage[];
    }
  ): Promise<CanonicalSnapshot>;
}

export const INGEST_STALE_MS = 15 * 60 * 1000;
