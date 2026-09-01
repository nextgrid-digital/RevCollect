import { parseJsonBody } from '@/lib/json/parse-json-body';
import { sendInboxFollowUpRequest } from '../extract/record-inbox-send';
import type { RevCollectService, SendInboxFollowUpInput, CollectionDecisionInput } from './service';
import type {
  DataAccessEvent,
  DeletionRequestResult,
  InboxSelectionData,
  TenantDataExport,
  TenantId
} from './types';
import { MOCK_TENANT_ID } from './types';
import type {
  AgentActivationResult,
  AgentAddonStatus,
  AgentConfig,
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
import type { CustomerStatusSummary } from './types';

async function getJson<T>(op: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL('/api/revcollect', 'http://local.invalid');
  url.searchParams.set('op', op);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const response = await fetch(`${url.pathname}${url.search}`);
  const text = await response.text();
  if (!response.ok) {
    const detail = (() => {
      try {
        return parseJsonBody<{ error?: string }>(text);
      } catch {
        return null;
      }
    })();
    throw new Error(detail?.error ?? `Request failed: ${op}`);
  }
  return parseJsonBody<T>(text);
}

async function postJson<T>(op: string, payload?: unknown): Promise<T> {
  const response = await fetch('/api/revcollect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, payload })
  });
  const text = await response.text();
  if (!response.ok) {
    const detail = (() => {
      try {
        return parseJsonBody<{ error?: string }>(text);
      } catch {
        return null;
      }
    })();
    throw new Error(detail?.error ?? `Request failed: ${op}`);
  }
  return parseJsonBody<T>(text);
}

/** Browser-safe proxy to the Xero-backed service via /api/revcollect. */
export class HttpXeroRevCollectService implements RevCollectService {
  getTenantId(): TenantId {
    return MOCK_TENANT_ID;
  }

  listInboxMessages() {
    return getJson<InboxMessage[]>('listInboxMessages');
  }

  async getDefaultInboxMessageId() {
    const data = await getJson<{ id: string }>('getDefaultInboxMessageId');
    return data.id;
  }

  getInboxThreadForCustomer(customerId: string) {
    return getJson<InboxMessage | undefined>('getInboxThreadForCustomer', { customerId });
  }

  getInboxSelectionData(messageId: string) {
    return getJson<InboxSelectionData | null>('getInboxSelectionData', { messageId });
  }

  listCustomers() {
    return getJson<Customer[]>('listCustomers');
  }

  getCustomerById(id: string) {
    return getJson<Customer | undefined>('getCustomerById', { id });
  }

  getCustomerContext(customerId: string) {
    return getJson<CustomerInboxContext | null>('getCustomerContext', { customerId });
  }

  getCustomerStatusSummary() {
    return getJson<CustomerStatusSummary>('getCustomerStatusSummary');
  }

  listInvoices() {
    return getJson<Invoice[]>('listInvoices');
  }

  getInvoicesForCustomer(customerId: string) {
    return getJson<Invoice[]>('getInvoicesForCustomer', { customerId });
  }

  getInvoicesByBucket(bucket: AgingBucket) {
    return getJson<Invoice[]>('getInvoicesByBucket', { bucket });
  }

  getAgingBuckets() {
    return getJson<AgingBucketSummary[]>('getAgingBuckets');
  }

  getAgingReport(filters: AgingReportFilters) {
    return getJson<{
      summary: AgingReportSummary;
      chartBuckets: AgingChartBucketRow[];
      customerBreakdown: AgingCustomerBreakdownRow[];
    }>('getAgingReport', {
      period: filters.period,
      sort: filters.sort,
      customerId: filters.customerId
    });
  }

  getAgingReportSummary(filters: AgingReportFilters) {
    return this.getAgingReport(filters).then((data) => data.summary);
  }

  getAgingChartBuckets(filters: AgingReportFilters) {
    return this.getAgingReport(filters).then((data) => data.chartBuckets);
  }

  getAgingCustomerBreakdown(filters: AgingReportFilters) {
    return this.getAgingReport(filters).then((data) => data.customerBreakdown);
  }

  getThreadEmails(threadId: string) {
    return this.getInboxSelectionData(threadId).then(
      (selection) => selection?.threadEmails ?? ([] as ThreadEmail[])
    );
  }

  getTimelineForCustomer(customerId: string) {
    return getJson<TimelineEvent[]>('getTimelineForCustomer', { customerId });
  }

  async getAgentDraftMetaForMessage() {
    return undefined;
  }

  async countAgentDraftsReady() {
    const data = await getJson<{ count: number }>('countAgentDraftsReady');
    return data.count;
  }

  getAgentConfig() {
    return getJson<AgentConfig>('getAgentConfig');
  }

  updateAgentConfig(config: AgentConfig) {
    return postJson<AgentConfig>('updateAgentConfig', config);
  }

  getLatestAriRun() {
    return getJson<AriRunRecord | null>('getLatestAriRun');
  }

  getAgentAddonStatus() {
    return getJson<AgentAddonStatus>('getAgentAddonStatus');
  }

  subscribeAgentAddon() {
    return postJson<AgentAddonStatus>('subscribeAgentAddon');
  }

  activateAgent() {
    return postJson<AgentActivationResult>('activateAgent');
  }

  async getIntegrationStatus(): Promise<IntegrationStatus> {
    const response = await fetch('/api/integrations/status');
    if (!response.ok) throw new Error('Failed to load integration status');
    return response.json() as Promise<IntegrationStatus>;
  }

  getWorkspaceGeneralSettings() {
    return getJson<WorkspaceGeneralSettings>('getWorkspaceGeneralSettings');
  }

  updateWorkspaceGeneralSettings(settings: WorkspaceGeneralSettings) {
    return postJson<WorkspaceGeneralSettings>('updateWorkspaceGeneralSettings', settings);
  }

  sendInboxFollowUp(input: SendInboxFollowUpInput) {
    return sendInboxFollowUpRequest(input);
  }

  recordCollectionDecision(input: CollectionDecisionInput) {
    return postJson<Customer>('recordCollectionDecision', input);
  }

  async exportTenantData(_tenantId: TenantId): Promise<TenantDataExport> {
    throw new Error('Export is only available on the server');
  }

  async requestTenantDeletion(tenantId: TenantId): Promise<DeletionRequestResult> {
    return {
      requestId: `client-del-${Date.now()}`,
      tenantId,
      status: 'queued',
      message: 'Deletion must be requested from a server action'
    };
  }

  async logDataAccess(_event: DataAccessEvent): Promise<void> {
    // no-op on client
  }
}

let httpService: HttpXeroRevCollectService | undefined;

export function getHttpXeroRevCollectService(): HttpXeroRevCollectService {
  if (!httpService) httpService = new HttpXeroRevCollectService();
  return httpService;
}
