import type {
  AgentConfig,
  AgentDraftMeta,
  AgingBucket,
  AgingBucketSummary,
  AgingChartBucketRow,
  AgingCustomerBreakdownRow,
  AgingReportFilters,
  AgingReportSummary,
  Customer,
  InboxMessage,
  IntegrationStatus,
  Invoice,
  ThreadEmail,
  TimelineEvent
} from '../types';
import type {
  CustomerStatusSummary,
  DataAccessEvent,
  DeletionRequestResult,
  InboxSelectionData,
  TenantDataExport,
  TenantId
} from './types';

export interface RevCollectService {
  getTenantId(): TenantId;

  listInboxMessages(): Promise<InboxMessage[]>;
  getDefaultInboxMessageId(): Promise<string>;
  getInboxThreadForCustomer(customerId: string): Promise<InboxMessage | undefined>;
  getInboxSelectionData(messageId: string): Promise<InboxSelectionData | null>;

  listCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
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
  getIntegrationStatus(): Promise<IntegrationStatus>;

  exportTenantData(tenantId: TenantId): Promise<TenantDataExport>;
  requestTenantDeletion(tenantId: TenantId): Promise<DeletionRequestResult>;
  logDataAccess(event: DataAccessEvent): Promise<void>;
}
