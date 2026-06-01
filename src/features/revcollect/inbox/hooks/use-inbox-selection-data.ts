import { useMemo } from 'react';
import {
  getAiSummaryForThread,
  getCustomerById,
  getCustomerInboxContext,
  getEscalationInsightForCustomer,
  getThreadEmails,
  getTimelineForCustomer,
  inboxMessages
} from '../../mock-data';
import type {
  Customer,
  CustomerInboxContext,
  InboxMessage,
  ThreadEmail,
  TimelineEvent
} from '../../types';

export interface InboxSelectionData {
  message: InboxMessage;
  customer: Customer;
  threadEmails: ThreadEmail[];
  timelineEvents: TimelineEvent[];
  inboxContext: CustomerInboxContext;
  threadSummary: string;
  escalationInsight: string | undefined;
  aiInsightText: string;
  latestEmail: ThreadEmail | undefined;
}

export function useInboxSelectionData(messageId: string | null): InboxSelectionData | null {
  return useMemo(() => {
    if (!messageId) return null;

    const message = inboxMessages.find((item) => item.id === messageId);
    if (!message) return null;

    const customer = getCustomerById(message.customerId);
    if (!customer) return null;

    const threadEmails = getThreadEmails(message.id);
    const timelineEvents = getTimelineForCustomer(customer.id);
    const inboxContext = getCustomerInboxContext(customer.id, customer);
    const threadSummary = getAiSummaryForThread(message.id);
    const escalationInsight = getEscalationInsightForCustomer(customer.id);
    const aiInsightText = inboxContext.aiInsight || (threadSummary ? threadSummary : '');

    return {
      message,
      customer,
      threadEmails,
      timelineEvents,
      inboxContext,
      threadSummary,
      escalationInsight,
      aiInsightText,
      latestEmail: threadEmails[threadEmails.length - 1]
    };
  }, [messageId]);
}
