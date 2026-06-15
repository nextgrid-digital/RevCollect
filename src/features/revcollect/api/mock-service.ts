import {
  agentConfig,
  countAgentDraftsReady,
  customers,
  getAgentDraftMetaForMessage,
  getAgingBuckets,
  getCustomerById,
  getCustomerInboxContext,
  getCustomerStatusSummary,
  getDefaultInboxMessageId,
  getInvoicesByBucket,
  getInvoicesForCustomer,
  getLastActionForCustomer,
  getOpenInvoiceNumbersForCustomer,
  getThreadEmails,
  getTimelineForCustomer,
  inboxMessages,
  integrationStatus,
  invoices,
  getAiSummaryForThread,
  getAiDraftForMessage
} from '../mock-data';
import type { RevCollectService } from './service';
import type {
  DataAccessEvent,
  DeletionRequestResult,
  InboxSelectionData,
  TenantDataExport,
  TenantId
} from './types';
import { MOCK_TENANT_ID as TENANT_ID } from './types';

function resolveMock<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

export class MockRevCollectService implements RevCollectService {
  getTenantId(): TenantId {
    return TENANT_ID;
  }

  listInboxMessages() {
    return resolveMock(inboxMessages);
  }

  getDefaultInboxMessageId() {
    return resolveMock(getDefaultInboxMessageId());
  }

  async getInboxSelectionData(messageId: string): Promise<InboxSelectionData | null> {
    const message = inboxMessages.find((item) => item.id === messageId);
    if (!message) return null;

    const customer = getCustomerById(message.customerId);
    if (!customer) return null;

    const threadEmails = getThreadEmails(message.id);
    const timelineEvents = getTimelineForCustomer(customer.id);
    const inboxContext = getCustomerInboxContext(customer.id, customer);
    const threadSummary = getAiSummaryForThread(message.id);

    return {
      message,
      customer,
      threadEmails,
      timelineEvents,
      inboxContext,
      threadSummary,
      aiInsightText: inboxContext.aiInsight || threadSummary,
      deepAnalysisText: inboxContext.deepAnalysis,
      latestEmail: threadEmails[threadEmails.length - 1],
      agentDraftMeta: getAgentDraftMetaForMessage(message.id),
      aiDraftBase: getAiDraftForMessage(message.id),
      lastAction: getLastActionForCustomer(customer.id),
      openInvoiceNumbers: getOpenInvoiceNumbersForCustomer(customer.id)
    };
  }

  listCustomers() {
    return resolveMock(customers);
  }

  getCustomerById(id: string) {
    return resolveMock(getCustomerById(id));
  }

  getCustomerStatusSummary() {
    return resolveMock(getCustomerStatusSummary());
  }

  listInvoices() {
    return resolveMock(invoices);
  }

  getInvoicesForCustomer(customerId: string) {
    return resolveMock(getInvoicesForCustomer(customerId));
  }

  getInvoicesByBucket(bucket: Parameters<RevCollectService['getInvoicesByBucket']>[0]) {
    return resolveMock(getInvoicesByBucket(bucket));
  }

  getAgingBuckets() {
    return resolveMock(getAgingBuckets());
  }

  getThreadEmails(threadId: string) {
    return resolveMock(getThreadEmails(threadId));
  }

  getTimelineForCustomer(customerId: string) {
    return resolveMock(getTimelineForCustomer(customerId));
  }

  getAgentDraftMetaForMessage(messageId: string) {
    return resolveMock(getAgentDraftMetaForMessage(messageId));
  }

  countAgentDraftsReady() {
    return resolveMock(countAgentDraftsReady());
  }

  getAgentConfig() {
    return resolveMock(agentConfig);
  }

  getIntegrationStatus() {
    return resolveMock(integrationStatus);
  }

  async exportTenantData(tenantId: TenantId): Promise<TenantDataExport> {
    const threadEmailLists = await Promise.all(inboxMessages.map((m) => getThreadEmails(m.id)));

    return {
      exportedAt: new Date().toISOString(),
      tenantId,
      customers: [...customers],
      invoices: [...invoices],
      inboxMessages: [...inboxMessages],
      threadEmails: threadEmailLists.flat(),
      timelineEvents: customers.flatMap((c) => getTimelineForCustomer(c.id)),
      agentConfig: { ...agentConfig },
      integrationStatus: { ...integrationStatus }
    };
  }

  async requestTenantDeletion(tenantId: TenantId): Promise<DeletionRequestResult> {
    return {
      requestId: `mock-del-${Date.now()}`,
      tenantId,
      status: 'queued',
      message:
        'Deletion request recorded (mock). When Supabase is connected, this queues full tenant erasure within 30 days of cancellation.'
    };
  }

  async logDataAccess(event: DataAccessEvent): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.info('[audit_log mock]', event);
    }
  }
}

let mockService: MockRevCollectService | undefined;

export function getMockRevCollectService(): MockRevCollectService {
  if (!mockService) mockService = new MockRevCollectService();
  return mockService;
}
