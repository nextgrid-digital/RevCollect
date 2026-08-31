import type {
  AgentActivationResult,
  AgentAddonStatus,
  AgentConfig,
  AgentDraftMeta,
  AgingBucket,
  AgingBucketSummary,
  AgingChartBucketRow,
  AgingCustomerBreakdownRow,
  AgingReportFilters,
  AgingReportSummary,
  AriRunRecord,
  Customer,
  CustomerInboxContext,
  InboxMessage,
  IntegrationStatus,
  Invoice,
  ThreadEmail,
  TimelineEvent,
  WorkspaceGeneralSettings
} from '../types';
import type {
  CustomerStatusSummary,
  DataAccessEvent,
  DeletionRequestResult,
  InboxSelectionData,
  TenantDataExport,
  TenantId
} from './types';

export interface SendInboxFollowUpInput {
  customerId: string;
  sentBody: string;
  originalBody?: string;
  kind?: 'reply' | 'draft_edit';
  messageId?: string;
}

export interface SendInboxFollowUpResult {
  ok: true;
  email?: ThreadEmail;
}

export interface RevCollectService {
  getTenantId(): TenantId;

  listInboxMessages(): Promise<InboxMessage[]>;
  getDefaultInboxMessageId(): Promise<string>;
  getInboxThreadForCustomer(customerId: string): Promise<InboxMessage | undefined>;
  getInboxSelectionData(messageId: string): Promise<InboxSelectionData | null>;

  listCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  getCustomerContext(customerId: string): Promise<CustomerInboxContext | null>;
  getCustomerStatusSummary(): Promise<CustomerStatusSummary>;

  listInvoices(): Promise<Invoice[]>;
  getInvoicesForCustomer(customerId: string): Promise<Invoice[]>;
  getInvoicesByBucket(bucket: AgingBucket): Promise<Invoice[]>;
  getAgingBuckets(): Promise<AgingBucketSummary[]>;
  getAgingReportSummary(filters: AgingReportFilters): Promise<AgingReportSummary>;
  getAgingChartBuckets(filters: AgingReportFilters): Promise<AgingChartBucketRow[]>;
  getAgingCustomerBreakdown(filters: AgingReportFilters): Promise<AgingCustomerBreakdownRow[]>;

  getThreadEmails(threadId: string): Promise<ThreadEmail[]>;
  getTimelineForCustomer(customerId: string): Promise<TimelineEvent[]>;
  getAgentDraftMetaForMessage(messageId: string): Promise<AgentDraftMeta | undefined>;
  countAgentDraftsReady(): Promise<number>;

  getAgentConfig(): Promise<AgentConfig>;
  updateAgentConfig(config: AgentConfig): Promise<AgentConfig>;
  getLatestAriRun(): Promise<AriRunRecord | null>;
  getAgentAddonStatus(): Promise<AgentAddonStatus>;
  subscribeAgentAddon(): Promise<AgentAddonStatus>;
  activateAgent(): Promise<AgentActivationResult>;
  getIntegrationStatus(): Promise<IntegrationStatus>;

  getWorkspaceGeneralSettings(): Promise<WorkspaceGeneralSettings>;
  updateWorkspaceGeneralSettings(
    settings: WorkspaceGeneralSettings
  ): Promise<WorkspaceGeneralSettings>;
  sendInboxFollowUp(input: SendInboxFollowUpInput): Promise<SendInboxFollowUpResult>;

  exportTenantData(tenantId: TenantId): Promise<TenantDataExport>;
  requestTenantDeletion(tenantId: TenantId): Promise<DeletionRequestResult>;
  logDataAccess(event: DataAccessEvent): Promise<void>;
}
