import { fetchXeroAccountsReceivable, XeroNotConnectedError } from '@/lib/integrations/xero-api';
import { getIntegrationStatus as getLiveIntegrationStatus } from '@/lib/integrations/get-integration-status';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import { syncAgentConfigTone } from '../agent/lib/follow-up-style';
import {
  agentAddonStatus as initialAgentAddonStatus,
  agentConfig as initialAgentConfig
} from '../mock-data';
import { DEFAULT_WORKSPACE_GENERAL_SETTINGS } from '../settings/lib/workspace-settings-defaults';
import type {
  AgentActivationResult,
  AgentAddonStatus,
  AgentConfig,
  AgingBucket,
  AgingReportFilters,
  Customer,
  InboxMessage,
  Invoice,
  ThreadEmail,
  TimelineEvent,
  WorkspaceGeneralSettings
} from '../types';
import { getDaysOverdueFromDueDate } from '../utils';
import type { RevCollectService } from './service';
import type {
  DataAccessEvent,
  DeletionRequestResult,
  InboxSelectionData,
  TenantDataExport,
  TenantId
} from './types';
import { MOCK_TENANT_ID as TENANT_ID } from './types';
import {
  agingChartBucketsFromInvoices,
  agingCustomerBreakdownFromInvoices,
  agingReportSummaryFromInvoices,
  buildAgingBucketsFromInvoices,
  buildCustomerContextFromInvoices,
  buildCustomerStatusSummary,
  buildSyntheticInboxFromInvoices,
  mapXeroCustomers,
  mapXeroInvoices
} from './xero-map';

let mutableAgentConfig: AgentConfig = structuredClone(initialAgentConfig);
let mutableAgentAddonStatus: AgentAddonStatus = { ...initialAgentAddonStatus };
let mutableWorkspaceGeneralSettings: WorkspaceGeneralSettings = structuredClone(
  DEFAULT_WORKSPACE_GENERAL_SETTINGS
);

interface LoadedArData {
  customers: Customer[];
  invoices: Invoice[];
  inboxMessages: InboxMessage[];
}

async function loadArData(): Promise<LoadedArData> {
  try {
    const { contacts, invoices: rawInvoices } =
      await fetchXeroAccountsReceivable(getIntegrationTenantId());
    const invoices = mapXeroInvoices(rawInvoices);
    const customers = mapXeroCustomers(contacts, invoices);
    const inboxMessages = buildSyntheticInboxFromInvoices(invoices, customers);
    return { customers, invoices, inboxMessages };
  } catch (error) {
    if (error instanceof XeroNotConnectedError) {
      return { customers: [], invoices: [], inboxMessages: [] };
    }
    throw error;
  }
}

export class XeroRevCollectService implements RevCollectService {
  getTenantId(): TenantId {
    return TENANT_ID;
  }

  async listInboxMessages() {
    const { inboxMessages } = await loadArData();
    return inboxMessages;
  }

  async getDefaultInboxMessageId() {
    const messages = await this.listInboxMessages();
    return messages[0]?.id ?? '';
  }

  async getInboxThreadForCustomer(customerId: string) {
    const messages = await this.listInboxMessages();
    return messages.find((message) => message.customerId === customerId);
  }

  async getInboxSelectionData(messageId: string): Promise<InboxSelectionData | null> {
    const { customers, invoices, inboxMessages } = await loadArData();
    const message = inboxMessages.find((item) => item.id === messageId);
    if (!message) return null;

    const customer = customers.find((item) => item.id === message.customerId);
    if (!customer) return null;

    const customerInvoices = invoices.filter((invoice) => invoice.customerId === customer.id);
    const inboxContext = buildCustomerContextFromInvoices(customer, customerInvoices);
    const invoiceId = messageId.startsWith('xero-inv-')
      ? messageId.slice('xero-inv-'.length)
      : undefined;
    const focusInvoice = customerInvoices.find((invoice) => invoice.id === invoiceId);
    const days = focusInvoice
      ? getDaysOverdueFromDueDate(focusInvoice.dueDate)
      : customer.daysOverdue;

    const placeholderBody = focusInvoice
      ? `Invoice ${focusInvoice.number} is ${days} day${days === 1 ? '' : 's'} past due (${new Intl.NumberFormat(
          'en-US',
          { style: 'currency', currency: 'USD' }
        ).format(focusInvoice.amountCents / 100)}). Connect Gmail to sync real email threads.`
      : 'Connect Gmail to sync real collection email threads for this customer.';

    const threadEmails: ThreadEmail[] = [
      {
        id: `${message.id}-note`,
        threadId: message.id,
        author: 'agent',
        from: 'RevCollect',
        to: [customer.email],
        subject: message.subject,
        body: placeholderBody,
        sentAt: message.receivedAt
      }
    ];

    return {
      message,
      customer,
      threadEmails,
      timelineEvents: [],
      inboxContext,
      threadSummary: inboxContext.aiInsight,
      aiInsightText: inboxContext.aiInsight,
      deepAnalysisText: undefined,
      latestEmail: threadEmails[0],
      agentDraftMeta: undefined,
      aiDraftBase: `Hi ${customer.name},\n\nFollowing up on overdue invoice${focusInvoice ? ` ${focusInvoice.number}` : 's'}. Please let us know if you need anything to process payment.\n\nThank you`,
      lastAction: undefined,
      openInvoiceNumbers: customerInvoices.map((invoice) => invoice.number)
    };
  }

  async listCustomers() {
    const { customers } = await loadArData();
    return customers;
  }

  async getCustomerById(id: string) {
    const { customers } = await loadArData();
    return customers.find((customer) => customer.id === id);
  }

  async getCustomerContext(customerId: string) {
    const { customers, invoices } = await loadArData();
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return null;
    return buildCustomerContextFromInvoices(customer, invoices);
  }

  async getCustomerStatusSummary() {
    const { customers } = await loadArData();
    return buildCustomerStatusSummary(customers);
  }

  async listInvoices() {
    const { invoices } = await loadArData();
    return invoices;
  }

  async getInvoicesForCustomer(customerId: string) {
    const { invoices } = await loadArData();
    return invoices.filter((invoice) => invoice.customerId === customerId);
  }

  async getInvoicesByBucket(bucket: AgingBucket) {
    const { invoices } = await loadArData();
    return invoices.filter((invoice) => invoice.agingBucket === bucket);
  }

  async getAgingBuckets() {
    const { invoices } = await loadArData();
    return buildAgingBucketsFromInvoices(invoices);
  }

  async getAgingReportSummary(filters: AgingReportFilters) {
    const { invoices } = await loadArData();
    return agingReportSummaryFromInvoices(invoices, filters);
  }

  async getAgingChartBuckets(filters: AgingReportFilters) {
    const { invoices } = await loadArData();
    return agingChartBucketsFromInvoices(invoices, filters);
  }

  async getAgingCustomerBreakdown(filters: AgingReportFilters) {
    const { customers, invoices } = await loadArData();
    return agingCustomerBreakdownFromInvoices(invoices, customers, filters);
  }

  async getThreadEmails(threadId: string): Promise<ThreadEmail[]> {
    const selection = await this.getInboxSelectionData(threadId);
    return selection?.threadEmails ?? [];
  }

  async getTimelineForCustomer(_customerId: string): Promise<TimelineEvent[]> {
    return [];
  }

  async getAgentDraftMetaForMessage(_messageId: string) {
    return undefined;
  }

  async countAgentDraftsReady() {
    return 0;
  }

  async getAgentConfig() {
    return { ...mutableAgentConfig };
  }

  async updateAgentConfig(config: AgentConfig) {
    mutableAgentConfig = syncAgentConfigTone({ ...config });
    return { ...mutableAgentConfig };
  }

  async getAgentAddonStatus() {
    return { ...mutableAgentAddonStatus };
  }

  async subscribeAgentAddon() {
    mutableAgentAddonStatus = { ...mutableAgentAddonStatus, subscribed: true };
    return { ...mutableAgentAddonStatus };
  }

  async activateAgent(): Promise<AgentActivationResult> {
    if (!mutableAgentAddonStatus.subscribed) {
      return { active: false, needsBilling: true };
    }
    mutableAgentConfig = { ...mutableAgentConfig, isActive: true };
    return { active: true };
  }

  getIntegrationStatus() {
    return getLiveIntegrationStatus();
  }

  async getWorkspaceGeneralSettings() {
    return { ...mutableWorkspaceGeneralSettings };
  }

  async updateWorkspaceGeneralSettings(settings: WorkspaceGeneralSettings) {
    mutableWorkspaceGeneralSettings = structuredClone(settings);
    return { ...mutableWorkspaceGeneralSettings };
  }

  async exportTenantData(tenantId: TenantId): Promise<TenantDataExport> {
    const { customers, invoices, inboxMessages } = await loadArData();
    const threadEmailLists = await Promise.all(
      inboxMessages.map((message) => this.getThreadEmails(message.id))
    );

    return {
      exportedAt: new Date().toISOString(),
      tenantId,
      customers,
      invoices,
      inboxMessages,
      threadEmails: threadEmailLists.flat(),
      timelineEvents: [],
      agentConfig: { ...mutableAgentConfig },
      integrationStatus: await getLiveIntegrationStatus()
    };
  }

  async requestTenantDeletion(tenantId: TenantId): Promise<DeletionRequestResult> {
    return {
      requestId: `xero-del-${Date.now()}`,
      tenantId,
      status: 'queued',
      message:
        'Deletion request recorded. When Supabase tenant storage is connected, this queues full erasure.'
    };
  }

  async logDataAccess(event: DataAccessEvent): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('[audit_log xero]', event);
    }
  }
}

let xeroService: XeroRevCollectService | undefined;

export function getXeroRevCollectService(): XeroRevCollectService {
  if (!xeroService) xeroService = new XeroRevCollectService();
  return xeroService;
}

export { XeroNotConnectedError };
