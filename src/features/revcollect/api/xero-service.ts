import 'server-only';
import { fetchXeroAccountsReceivable, XeroNotConnectedError } from '@/lib/integrations/xero-api';
import { getIntegrationStatus as getLiveIntegrationStatus } from '@/lib/integrations/get-integration-status';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import {
  DEFAULT_ADDON_STATUS,
  DEFAULT_AGENT_CONFIG,
  defaultWorkspaceAgentConfig,
  emptyIntelligence
} from '@/lib/canonical/defaults';
import { ensureXeroIngest } from '@/lib/canonical/ingest-xero';
import { getCanonicalStore } from '@/lib/canonical/store';
import { getLatestChaseRun as readLatestChaseRun } from '@/lib/chase/record-chase-run';
import { sweepExpiredSituations } from '@/features/revcollect/extract/sweeper';
import { syncAgentConfigTone } from '../agent/lib/follow-up-style';
import { DEFAULT_WORKSPACE_GENERAL_SETTINGS } from '../settings/lib/workspace-settings-defaults';
import type {
  AgentActivationResult,
  AgentConfig,
  AgentDraftMeta,
  AgingBucket,
  AgingReportFilters,
  ChaseRunRecord,
  Customer,
  InboxMessage,
  Invoice,
  ThreadEmail,
  TimelineEvent,
  WorkspaceGeneralSettings
} from '../types';
import { formatCurrencyWhole, getDaysOverdueFromDueDate } from '../utils';
import { isOpenCanonicalInvoice } from '../lib/invoice-open';
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
  mapXeroCreditNotes,
  mapXeroCustomers,
  mapXeroInvoices
} from './xero-map';

function formatPreparedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function overlayDrafts(messages: InboxMessage[], drafts: { customerId: string }[]): InboxMessage[] {
  const ready = new Set(drafts.map((draft) => draft.customerId));
  return messages.map((message) =>
    ready.has(message.customerId) ? { ...message, agentDraftReady: true } : message
  );
}

interface LoadedArData {
  tenantId: string;
  customers: Customer[];
  invoices: Invoice[];
  inboxMessages: InboxMessage[];
}

async function loadArData(): Promise<LoadedArData> {
  const tenantId = await getIntegrationTenantId();
  await sweepExpiredSituations(tenantId);
  const snapshot = await ensureXeroIngest(tenantId);
  if (snapshot.customers.length > 0 || snapshot.invoices.length > 0) {
    const customers = snapshot.customers.map((customer) => ({
      ...customer,
      relationshipState:
        customer.relationshipState ??
        snapshot.intelligenceByCustomerId[customer.id]?.relationshipState ??
        emptyIntelligence().relationshipState
    }));
    return {
      tenantId,
      customers,
      invoices: snapshot.invoices,
      inboxMessages: overlayDrafts(snapshot.inboxMessages, snapshot.drafts)
    };
  }

  try {
    const {
      contacts,
      invoices: rawInvoices,
      creditNotes
    } = await fetchXeroAccountsReceivable(tenantId);
    const invoices = [...mapXeroInvoices(rawInvoices), ...mapXeroCreditNotes(creditNotes)];
    const customers = mapXeroCustomers(contacts, invoices);
    const inboxMessages = buildSyntheticInboxFromInvoices(invoices, customers);
    return { tenantId, customers, invoices, inboxMessages };
  } catch (error) {
    if (error instanceof XeroNotConnectedError) {
      return { tenantId, customers: [], invoices: [], inboxMessages: [] };
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
    const openInvoices = customerInvoices.filter(isOpenCanonicalInvoice);
    const inboxContext = buildCustomerContextFromInvoices(customer, customerInvoices);
    const invoiceId = messageId.startsWith('xero-inv-')
      ? messageId.slice('xero-inv-'.length)
      : undefined;
    const focusInvoice = invoiceId
      ? openInvoices.find((invoice) => invoice.id === invoiceId)
      : openInvoices.toSorted(
          (a, b) => getDaysOverdueFromDueDate(b.dueDate) - getDaysOverdueFromDueDate(a.dueDate)
        )[0];
    const days = focusInvoice
      ? getDaysOverdueFromDueDate(focusInvoice.dueDate)
      : customer.daysOverdue;

    const invoiceSummary =
      openInvoices.length === 1
        ? `Invoice ${openInvoices[0].number}`
        : `${openInvoices.length} open invoices (${openInvoices.map((invoice) => invoice.number).join(', ')})`;

    const placeholderBody = focusInvoice
      ? `${invoiceSummary} totaling ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(customer.balanceCents / 100)}. ${
          days > 0
            ? `Oldest overdue item is ${days} day${days === 1 ? '' : 's'} past due.`
            : 'Nothing is overdue yet.'
        } Connect Gmail to sync real email threads.`
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

    const agentDraftMeta = await this.getAgentDraftMetaForMessage(message.id);

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
      agentDraftMeta,
      aiDraftBase: `Hi ${customer.name},\n\nFollowing up on overdue invoice${focusInvoice ? ` ${focusInvoice.number}` : 's'}. Please let us know if you need anything to process payment.\n\nThank you`,
      lastAction: undefined,
      openInvoiceNumbers: openInvoices.map((invoice) => invoice.number)
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
    return invoices.filter(
      (invoice) => isOpenCanonicalInvoice(invoice) && invoice.agingBucket === bucket
    );
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

  async getTimelineForCustomer(customerId: string): Promise<TimelineEvent[]> {
    const tenantId = await getIntegrationTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    const invoiceById = new Map(snapshot.invoices.map((invoice) => [invoice.id, invoice]));
    return snapshot.payments
      .filter((payment) => payment.customerId === customerId)
      .toSorted((left, right) => right.paidAt.localeCompare(left.paidAt))
      .map((payment) => {
        const invoice = payment.invoiceId ? invoiceById.get(payment.invoiceId) : undefined;
        return {
          id: payment.id,
          customerId,
          type: 'payment' as const,
          title: 'Payment received',
          description: invoice
            ? `${formatCurrencyWhole(payment.amountCents)} · ${invoice.number}`
            : formatCurrencyWhole(payment.amountCents),
          occurredAt: payment.paidAt
        };
      });
  }

  async getAgentDraftMetaForMessage(messageId: string): Promise<AgentDraftMeta | undefined> {
    const tenantId = await getIntegrationTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    const draft = snapshot.drafts.find(
      (item) => item.threadId === messageId || `xero-customer-${item.customerId}` === messageId
    );
    if (!draft) return undefined;
    return {
      title: draft.title,
      preparedAtLabel: formatPreparedAt(draft.preparedAt),
      body: draft.body,
      tone: (draft.tone as AgentDraftMeta['tone']) || 'professional'
    };
  }

  async countAgentDraftsReady() {
    const tenantId = await getIntegrationTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    return snapshot.drafts.length;
  }

  async getAgentConfig() {
    const tenantId = await getIntegrationTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    if (snapshot.agentConfig) return { ...snapshot.agentConfig };
    return defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
  }

  async updateAgentConfig(config: AgentConfig) {
    const tenantId = await getIntegrationTenantId();
    const store = await getCanonicalStore();
    const snapshot = await store.read(tenantId);
    const next = syncAgentConfigTone({ ...config, autoSendEnabled: false });
    snapshot.agentConfig = next;
    await store.write(tenantId, snapshot);
    return { ...next };
  }

  async getLatestChaseRun(): Promise<ChaseRunRecord | null> {
    const tenantId = await getIntegrationTenantId();
    return readLatestChaseRun(tenantId);
  }

  async getAgentAddonStatus() {
    const tenantId = await getIntegrationTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    return { ...(snapshot.agentAddonStatus ?? DEFAULT_ADDON_STATUS) };
  }

  async subscribeAgentAddon() {
    const tenantId = await getIntegrationTenantId();
    const store = await getCanonicalStore();
    const snapshot = await store.read(tenantId);
    snapshot.agentAddonStatus = {
      ...(snapshot.agentAddonStatus ?? DEFAULT_ADDON_STATUS),
      subscribed: true
    };
    await store.write(tenantId, snapshot);
    return { ...snapshot.agentAddonStatus };
  }

  async activateAgent(): Promise<AgentActivationResult> {
    const tenantId = await getIntegrationTenantId();
    const store = await getCanonicalStore();
    const snapshot = await store.read(tenantId);
    const addon = snapshot.agentAddonStatus ?? DEFAULT_ADDON_STATUS;
    if (!addon.subscribed) {
      return { active: false, needsBilling: true };
    }
    const config = snapshot.agentConfig ?? defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
    snapshot.agentConfig = { ...config, isActive: true };
    snapshot.agentAddonStatus = addon;
    await store.write(tenantId, snapshot);
    return { active: true };
  }

  getIntegrationStatus() {
    return getLiveIntegrationStatus();
  }

  async getWorkspaceGeneralSettings() {
    const tenantId = await getIntegrationTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    return structuredClone(snapshot.workspaceSettings ?? DEFAULT_WORKSPACE_GENERAL_SETTINGS);
  }

  async updateWorkspaceGeneralSettings(settings: WorkspaceGeneralSettings) {
    const tenantId = await getIntegrationTenantId();
    const store = await getCanonicalStore();
    const snapshot = await store.read(tenantId);
    snapshot.workspaceSettings = structuredClone(settings);
    await store.write(tenantId, snapshot);
    return structuredClone(settings);
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
      agentConfig: await this.getAgentConfig(),
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
