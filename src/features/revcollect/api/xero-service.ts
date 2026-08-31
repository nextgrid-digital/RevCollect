import 'server-only';
import { after } from 'next/server';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';
import { getIntegrationStatus as getLiveIntegrationStatus } from '@/lib/integrations/get-integration-status';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import {
  DEFAULT_ADDON_STATUS,
  DEFAULT_AGENT_CONFIG,
  defaultWorkspaceAgentConfig,
  emptyIntelligence
} from '@/lib/canonical/defaults';
import { scheduleBackgroundXeroIngest } from '@/lib/canonical/ingest-xero';
import { scheduleBackgroundGmailSync } from '@/lib/canonical/sync-gmail';
import {
  overlayInboxWithSentEmails,
  persistSentFollowUp,
  sentEmailsForThread,
  timelineEventsFromSentEmails
} from '@/lib/canonical/sent-emails';
import { getCanonicalStore } from '@/lib/canonical/store';
import { appendCanSpamFooter } from '../compliance/can-spam';
import { sendGmailMessage, sentEmailFromResult } from '@/lib/integrations/gmail-api';
import { getLatestAriRun as readLatestAriRun } from '@/lib/ari/record-ari-run';
import { syncAgentConfigTone } from '../agent/lib/follow-up-style';
import { DEFAULT_WORKSPACE_GENERAL_SETTINGS } from '../settings/lib/workspace-settings-defaults';
import type {
  AgentActivationResult,
  AgentConfig,
  AgentDraftMeta,
  AgingBucket,
  AgingReportFilters,
  AriRunRecord,
  Customer,
  InboxMessage,
  Invoice,
  ThreadEmail,
  TimelineEvent,
  WorkspaceGeneralSettings
} from '../types';
import { formatCurrencyWhole, getDaysOverdueFromDueDate } from '../utils';
import { isOpenCanonicalInvoice } from '../lib/invoice-open';
import type { RevCollectService, SendInboxFollowUpInput, SendInboxFollowUpResult } from './service';
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
  buildCustomerStatusSummary
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
  sentEmails: ThreadEmail[];
}

const AR_DATA_MEMO_TTL_MS = 8_000;
const arDataMemo = new Map<string, { expiresAt: number; promise: Promise<LoadedArData> }>();

function clearArDataMemo(tenantId: string): void {
  arDataMemo.delete(tenantId);
}

async function readArData(tenantId: string): Promise<LoadedArData> {
  const snapshot = await (await getCanonicalStore()).read(tenantId);
  const customers = snapshot.customers.map((customer) => ({
    ...customer,
    relationshipState:
      customer.relationshipState ??
      snapshot.intelligenceByCustomerId[customer.id]?.relationshipState ??
      emptyIntelligence().relationshipState
  }));

  after(() => {
    void scheduleBackgroundXeroIngest(tenantId, snapshot.ingestedAt).then((didIngest) => {
      if (didIngest) clearArDataMemo(tenantId);
    });
    void scheduleBackgroundGmailSync(tenantId).then((didSync) => {
      if (didSync) clearArDataMemo(tenantId);
    });
  });

  return {
    tenantId,
    customers,
    invoices: snapshot.invoices,
    inboxMessages: overlayDrafts(
      overlayInboxWithSentEmails(snapshot.inboxMessages, snapshot.sentEmails ?? []),
      snapshot.drafts
    ),
    sentEmails: snapshot.sentEmails ?? []
  };
}

async function loadArData(): Promise<LoadedArData> {
  const tenantId = await getIntegrationTenantId();
  const cached = arDataMemo.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = readArData(tenantId).catch((error) => {
    arDataMemo.delete(tenantId);
    throw error;
  });
  arDataMemo.set(tenantId, { expiresAt: Date.now() + AR_DATA_MEMO_TTL_MS, promise });
  return promise;
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
    const { customers, invoices, inboxMessages, sentEmails } = await loadArData();
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

    const threadEmails = sentEmailsForThread(sentEmails, message.id, customer.id);
    const latestSent = threadEmails[threadEmails.length - 1];
    const agentDraftMeta = await this.getAgentDraftMetaForMessage(message.id);
    const timelineEvents = await this.getTimelineForCustomer(customer.id);

    return {
      message,
      customer,
      threadEmails,
      timelineEvents,
      inboxContext,
      threadSummary: inboxContext.aiInsight,
      aiInsightText: inboxContext.aiInsight,
      deepAnalysisText: undefined,
      latestEmail: latestSent,
      agentDraftMeta,
      aiDraftBase: `Hi ${customer.name},\n\nFollowing up on overdue invoice${focusInvoice ? ` ${focusInvoice.number}` : 's'}. Please let us know if you need anything to process payment.\n\nThank you`,
      lastAction: latestSent
        ? {
            title: 'Follow-up sent',
            occurredAtLabel: formatPreparedAt(latestSent.sentAt)
          }
        : undefined,
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

  async getAgingReport(filters: AgingReportFilters) {
    const { customers, invoices } = await loadArData();
    return {
      summary: agingReportSummaryFromInvoices(invoices, filters),
      chartBuckets: agingChartBucketsFromInvoices(invoices, filters),
      customerBreakdown: agingCustomerBreakdownFromInvoices(invoices, customers, filters)
    };
  }

  async getThreadEmails(threadId: string): Promise<ThreadEmail[]> {
    const selection = await this.getInboxSelectionData(threadId);
    return selection?.threadEmails ?? [];
  }

  async getTimelineForCustomer(customerId: string): Promise<TimelineEvent[]> {
    const tenantId = await getIntegrationTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    const invoiceById = new Map(snapshot.invoices.map((invoice) => [invoice.id, invoice]));
    const payments = snapshot.payments
      .filter((payment) => payment.customerId === customerId)
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
    const sent = timelineEventsFromSentEmails(snapshot.sentEmails ?? [], customerId);
    return [...payments, ...sent].toSorted((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt)
    );
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

  async getLatestAriRun(): Promise<AriRunRecord | null> {
    const tenantId = await getIntegrationTenantId();
    return readLatestAriRun(tenantId);
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

  async sendInboxFollowUp(input: SendInboxFollowUpInput): Promise<SendInboxFollowUpResult> {
    const tenantId = await getIntegrationTenantId();
    const { customers, inboxMessages } = await loadArData();
    const customer = customers.find((item) => item.id === input.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    const to = customer.email.trim();
    if (!to || !to.includes('@')) {
      throw new Error('This customer has no email address in Xero');
    }

    const threadId = input.messageId ?? `xero-customer-${customer.id}`;
    const message = inboxMessages.find(
      (item) => item.id === threadId || item.customerId === customer.id
    );
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    const body = appendCanSpamFooter(input.sentBody);
    const existingThread = (snapshot.sentEmails ?? []).find(
      (item) => item.customerId === customer.id && item.gmailThreadId
    );
    const sent = await sendGmailMessage({
      tenantId,
      to,
      subject: message?.subject ?? `Follow-up — ${customer.company}`,
      body,
      fromName: snapshot.workspaceSettings?.sendFromName,
      gmailThreadId: existingThread?.gmailThreadId
    });
    const email = sentEmailFromResult(sent, { threadId, customerId: customer.id });
    await persistSentFollowUp({
      tenantId,
      customerId: customer.id,
      email
    });
    clearArDataMemo(tenantId);
    return { ok: true, email };
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
