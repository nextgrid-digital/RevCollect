import type { CollectionStatus, Customer, InboxMessage, ThreadMessage } from './types';

const SIGNATURE = '\n\nBest regards,\nRevCollect Collections Team';

type ScenarioTemplate = {
  subject: string;
  preview: string;
  unread: boolean;
  daysAgo: number;
  summary: string;
  draft: string;
  turns: Array<{ author: 'customer' | 'agent'; body: string; hoursBeforeLatest: number }>;
};

const scenarioByStatus: Record<CollectionStatus, ScenarioTemplate> = {
  overdue: {
    subject: 'Re: Overdue balance follow-up',
    preview: 'AP is reviewing the open invoices before releasing payment...',
    unread: true,
    daysAgo: 1,
    summary:
      'Customer acknowledges overdue balance and is waiting on internal AP review. Prior reminders were sent and a credit memo question remains open.',
    draft:
      'Thank you for the update. I have escalated this to our billing team and will send a revised aging statement within one business day.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 72,
        body: 'Hi,\n\nThis is a friendly reminder that your account has an overdue balance. Please let us know when payment can be released.'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 48,
        body: 'Thanks for reaching out. Our AP team is reviewing the invoice packet before payment can be scheduled.'
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: 'Understood. Can you confirm whether any invoices are currently under internal dispute?'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 2,
        body: 'AP is reviewing the open invoices before releasing payment. Can you confirm whether prior credits were applied?'
      }
    ]
  },
  due_soon: {
    subject: 'Confirming upcoming invoice due date',
    preview: 'Invoice is in our system and scheduled for the due date...',
    unread: false,
    daysAgo: 3,
    summary:
      'Customer confirmed invoice receipt and no blockers on their side. Payment is expected on the stated due date unless treasury timing shifts.',
    draft:
      'Thank you for confirming the invoice is queued. We will monitor the due date and follow up only if payment is not received.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 96,
        body: 'Hi,\n\nPlease confirm receipt of the latest invoice and expected payment timing.'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 72,
        body: 'We received the invoice and added it to our AP queue for the upcoming due date.'
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: 'Great, thank you. Please share the expected remittance date if available.'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 4,
        body: 'Invoice is in our system and scheduled for the due date. No issues on our end.'
      }
    ]
  },
  in_dispute: {
    subject: 'Dispute on open invoice',
    preview: 'We are holding payment until billing discrepancy is reconciled...',
    unread: true,
    daysAgo: 2,
    summary:
      'Active dispute is blocking payment release. Customer requested supporting documentation and billing is validating shipment or pricing records.',
    draft:
      'Thank you for the details. We are pulling supporting records now and will respond with a resolution path within 48 hours.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 120,
        body: 'Hi,\n\nWe noticed payment has not been released on the disputed invoice. Can you share the reason for hold?'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 96,
        body: 'We identified a billing discrepancy and paused payment until records are reconciled.'
      },
      {
        author: 'agent',
        hoursBeforeLatest: 48,
        body: 'Understood. Please share the specific line items in question so we can investigate quickly.'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 6,
        body: 'We are holding payment until the billing discrepancy is reconciled. Please send corrected documentation.'
      }
    ]
  },
  promised: {
    subject: 'Payment commitment update',
    preview: 'We can honor payment by the committed date pending treasury approval...',
    unread: false,
    daysAgo: 2,
    summary:
      'Customer provided a payment commitment with a specific date. Treasury approval is pending and follow-up is needed if the date slips.',
    draft:
      'Thank you for confirming the payment commitment. I have noted the date on your account and will send an updated statement for your records.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 72,
        body: 'Hi,\n\nCan you confirm when payment will be released for the open balance?'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 48,
        body: 'We can commit to payment by the end of this week once treasury approves the run.'
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: 'Thank you. Please confirm the exact date so we can update our records.'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 3,
        body: 'We can honor payment by the committed date pending treasury approval. Please send an updated statement.'
      }
    ]
  },
  current: {
    subject: 'Upcoming invoice acknowledgment',
    preview: 'No open issues on our side for the upcoming invoice cycle...',
    unread: false,
    daysAgo: 4,
    summary:
      'Account is current with no immediate collection risk. Customer acknowledged upcoming invoice and requested standard remittance instructions.',
    draft:
      'Thank you for confirming. No further action is needed at this time. We will send remittance details with the next invoice cycle.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 96,
        body: 'Hi,\n\nSharing your upcoming invoice summary for visibility. Please confirm receipt.'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 72,
        body: 'Received. We will process this with our normal AP cycle.'
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: 'Thank you. Let us know if you need updated remittance instructions.'
      },
      {
        author: 'customer',
        hoursBeforeLatest: 8,
        body: 'No open issues on our side for the upcoming invoice cycle.'
      }
    ]
  }
};

const statusOverrides: Partial<Record<string, Partial<ScenarioTemplate>>> = {
  'cust-1': {
    subject: 'Re: Invoice INV-1042 — payment timing',
    preview: 'We received your reminder. AP is reviewing the March shipment dispute...',
    summary:
      'Sarah is waiting on AP review tied to a shipment dispute and credit memo CM-204. Two overdue invoices remain open on the account.',
    draft:
      'Hi Sarah,\n\nThank you for the update. I have asked our billing team to confirm whether credit memo CM-204 was applied to INV-1042. I will follow up within one business day with a revised statement.'
  },
  'cust-3': {
    subject: 'Dispute on INV-3301',
    preview: 'The quantity on the packing slip does not match what we received...',
    summary:
      'Elena opened a quantity mismatch dispute on INV-3301. Warehouse documentation has been requested to unblock payment.',
    draft:
      'Hi Elena,\n\nThank you for flagging the quantity discrepancy on INV-3301. We are pulling the packing slip and delivery receipt now and will respond with a resolution within 48 hours.'
  },
  'cust-6': {
    subject: 'Need payment plan options',
    preview: 'Cash flow is tight this quarter. Can we split the overdue balance...',
    summary:
      'Tom requested a three-installment plan due to cash-flow constraints on a 60+ day balance. Escalation notice was previously sent.',
    draft:
      'Hi Tom,\n\nThank you for reaching out. We can offer a three-installment plan on the overdue balance. I will send proposed dates and amounts for your approval shortly.'
  },
  'cust-9': {
    subject: 'Partial payment sent for INV-9103',
    preview: 'We processed a partial payment today and need confirmation on remaining balance...',
    summary:
      'David sent a partial payment of $5,000 toward INV-9103 and asked about fee waiver on the remaining $3,300 balance.',
    draft:
      'Hi David,\n\nThank you for confirming the partial payment. We have applied the $5,000 remittance and the remaining balance is $3,300 across INV-9103 and INV-9114.'
  },
  'cust-16': {
    subject: 'Request for installment plan on legacy balance',
    preview: 'Can we split the oldest invoices over a 6-week payment schedule?',
    summary:
      'Iris requested a three-part payment plan for 90+ day legacy invoices. Finance call is scheduled with their controller.',
    draft:
      'Hi Iris,\n\nThanks for the payment-plan request. We can offer a 3-installment structure over six weeks for INV-16001 and INV-16008.'
  },
  'cust-26': {
    subject: 'Legal hold notice on oldest invoices',
    preview: 'Our counsel requested temporary hold while contract terms are reviewed.',
    unread: true,
    summary:
      'Lucas placed a legal hold on pre-February invoices while counsel reviews service-level terms. Automated outreach is paused.',
    draft:
      'Hi Lucas,\n\nThank you for the legal hold notice. We have paused automated outreach on the affected invoices and moved this account to managed review.'
  }
};

function addHours(isoBase: string, hours: number): string {
  const date = new Date(isoBase);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function buildThreadsForCustomers(customers: Customer[]): {
  inboxMessages: InboxMessage[];
  threadMessagesByThreadId: Record<string, ThreadMessage[]>;
  aiSummaryByThreadId: Record<string, string>;
  aiDraftByMessageId: Record<string, string>;
} {
  const inboxMessages: InboxMessage[] = [];
  const threadMessagesByThreadId: Record<string, ThreadMessage[]> = {};
  const aiSummaryByThreadId: Record<string, string> = {};
  const aiDraftByMessageId: Record<string, string> = {};

  customers.forEach((customer, index) => {
    const threadId = `msg-${index + 1}`;
    const baseTemplate = scenarioByStatus[customer.status];
    const override = statusOverrides[customer.id] ?? {};
    const template = { ...baseTemplate, ...override };

    const receivedAt = new Date();
    receivedAt.setDate(receivedAt.getDate() - template.daysAgo);
    receivedAt.setHours(9 + (index % 6), 14, 0, 0);
    const receivedAtIso = receivedAt.toISOString();

    inboxMessages.push({
      id: threadId,
      customerId: customer.id,
      subject: template.subject,
      preview: template.preview,
      receivedAt: receivedAtIso,
      unread: template.unread,
      channel: 'email'
    });

    threadMessagesByThreadId[threadId] = template.turns.map((turn, turnIndex) => ({
      id: `${threadId}-turn-${turnIndex + 1}`,
      threadId,
      author: turn.author,
      body: turn.body,
      sentAt: addHours(receivedAtIso, turn.hoursBeforeLatest)
    }));

    aiSummaryByThreadId[threadId] = template.summary;
    aiDraftByMessageId[threadId] = `${template.draft}${SIGNATURE}`;
  });

  return {
    inboxMessages,
    threadMessagesByThreadId,
    aiSummaryByThreadId,
    aiDraftByMessageId
  };
}

export function createInboxThreadData(customers: Customer[]) {
  return buildThreadsForCustomers(customers);
}
