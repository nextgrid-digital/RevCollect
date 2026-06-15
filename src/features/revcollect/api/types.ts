import type {
  AgentConfig,
  AgentDraftMeta,
  AgingBucket,
  AgingBucketSummary,
  CollectionStatus,
  Customer,
  CustomerInboxContext,
  InboxMessage,
  IntegrationStatus,
  Invoice,
  LastActionInsight,
  ThreadEmail,
  TimelineEvent
} from '../types';

/** Mock tenant used until Clerk orgs are wired. */
export const MOCK_TENANT_ID = '00000000-0000-4000-8000-000000000001';

export const RETENTION_POST_CANCEL_DAYS = 30;
export const RETENTION_EMAIL_BODY_MONTHS = 24;

export type TenantId = string;

export interface TenantScoped {
  tenantId: TenantId;
  createdAt: string;
  deletedAt?: string | null;
}

export type DbCustomer = Customer & TenantScoped;
export type DbInvoice = Invoice & TenantScoped;
export type DbInboxMessage = InboxMessage & TenantScoped;
export type DbThreadEmail = ThreadEmail & TenantScoped;

export interface DataAccessEvent {
  tenantId: TenantId;
  actorUserId?: string;
  action: DataAccessAction;
  resourceType: string;
  resourceId: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export type DataAccessAction =
  | 'thread.view'
  | 'thread_email.view'
  | 'customer.view'
  | 'data.export'
  | 'data.deletion_request'
  | 'admin.settings_change';

export interface InboxSelectionData {
  message: InboxMessage;
  customer: Customer;
  threadEmails: ThreadEmail[];
  timelineEvents: TimelineEvent[];
  inboxContext: CustomerInboxContext;
  threadSummary: string;
  aiInsightText: string;
  deepAnalysisText: string | undefined;
  latestEmail: ThreadEmail | undefined;
  agentDraftMeta: AgentDraftMeta | undefined;
  aiDraftBase: string;
  lastAction: LastActionInsight | undefined;
  openInvoiceNumbers: string[];
}

export interface TenantDataExport {
  exportedAt: string;
  tenantId: TenantId;
  customers: Customer[];
  invoices: Invoice[];
  inboxMessages: InboxMessage[];
  threadEmails: ThreadEmail[];
  timelineEvents: TimelineEvent[];
  agentConfig: AgentConfig;
  integrationStatus: IntegrationStatus;
}

export interface DeletionRequestResult {
  requestId: string;
  tenantId: TenantId;
  status: 'queued' | 'completed';
  message: string;
}

export type CustomerStatusSummary = Record<CollectionStatus, number>;
