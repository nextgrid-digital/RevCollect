import type {
  AgentConfig,
  AgingBucket,
  AgingBucketSummary,
  Customer,
  InboxMessage,
  IntegrationStatus,
  Invoice,
  TimelineEvent
} from './types';

export const customers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Sarah Chen',
    email: 'sarah@northwindlogistics.com',
    company: 'Northwind Logistics',
    status: 'overdue',
    balanceCents: 1845000,
    daysOverdue: 42
  },
  {
    id: 'cust-2',
    name: 'Marcus Webb',
    email: 'marcus@brightstudio.io',
    company: 'Bright Studio',
    status: 'due_soon',
    balanceCents: 620000,
    daysOverdue: 0
  },
  {
    id: 'cust-3',
    name: 'Elena Rodriguez',
    email: 'elena@harborfoods.co',
    company: 'Harbor Foods Co.',
    status: 'in_dispute',
    balanceCents: 2310000,
    daysOverdue: 18
  },
  {
    id: 'cust-4',
    name: 'James Okonkwo',
    email: 'james@apexmechanical.com',
    company: 'Apex Mechanical',
    status: 'promised',
    balanceCents: 975000,
    daysOverdue: 12
  },
  {
    id: 'cust-5',
    name: 'Priya Nair',
    email: 'priya@cloudstack.dev',
    company: 'CloudStack Dev',
    status: 'current',
    balanceCents: 0,
    daysOverdue: 0
  },
  {
    id: 'cust-6',
    name: 'Tom Bradley',
    email: 'tom@ridgelinebuilders.com',
    company: 'Ridgeline Builders',
    status: 'overdue',
    balanceCents: 4120000,
    daysOverdue: 67
  }
];

export const invoices: Invoice[] = [
  {
    id: 'inv-1',
    customerId: 'cust-1',
    number: 'INV-1042',
    amountCents: 945000,
    dueDate: '2026-03-15',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-2',
    customerId: 'cust-1',
    number: 'INV-1088',
    amountCents: 900000,
    dueDate: '2026-04-01',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-3',
    customerId: 'cust-2',
    number: 'INV-2011',
    amountCents: 620000,
    dueDate: '2026-05-20',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-4',
    customerId: 'cust-3',
    number: 'INV-3301',
    amountCents: 2310000,
    dueDate: '2026-04-28',
    status: 'in_dispute',
    agingBucket: '1-30'
  },
  {
    id: 'inv-5',
    customerId: 'cust-4',
    number: 'INV-4402',
    amountCents: 975000,
    dueDate: '2026-05-05',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-6',
    customerId: 'cust-6',
    number: 'INV-5501',
    amountCents: 2100000,
    dueDate: '2026-02-10',
    status: 'overdue',
    agingBucket: '61-90'
  },
  {
    id: 'inv-7',
    customerId: 'cust-6',
    number: 'INV-5520',
    amountCents: 2020000,
    dueDate: '2026-01-20',
    status: 'overdue',
    agingBucket: '90+'
  }
];

export const inboxMessages: InboxMessage[] = [
  {
    id: 'msg-1',
    customerId: 'cust-1',
    subject: 'Re: Invoice INV-1042 — payment timing',
    preview: 'We received your reminder. AP is reviewing the March shipment dispute...',
    body: 'Hi,\n\nWe received your reminder. AP is reviewing the March shipment dispute before releasing payment on INV-1042. Can you confirm the credit memo was applied?\n\nThanks,\nSarah',
    receivedAt: '2026-05-27T09:14:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-2',
    customerId: 'cust-3',
    subject: 'Dispute on INV-3301',
    preview: 'The quantity on the packing slip does not match what we received...',
    body: 'Hello,\n\nThe quantity on the packing slip does not match what we received. We are holding payment until this is reconciled.\n\nElena',
    receivedAt: '2026-05-26T16:42:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-3',
    customerId: 'cust-4',
    subject: 'Payment scheduled for next week',
    preview: 'I can commit to paying INV-4402 by Friday May 30...',
    body: 'James here — I can commit to paying INV-4402 by Friday May 30. Please send the updated statement.',
    receivedAt: '2026-05-26T11:05:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-4',
    customerId: 'cust-6',
    subject: 'Need payment plan options',
    preview: 'Cash flow is tight this quarter. Can we split the overdue balance...',
    body: 'Tom from Ridgeline — cash flow is tight this quarter. Can we split the overdue balance into three installments?',
    receivedAt: '2026-05-25T14:20:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-5',
    customerId: 'cust-2',
    subject: 'Confirming receipt of invoice',
    preview: 'Invoice INV-2011 is in our system for the May 20 due date.',
    body: 'Marcus — invoice INV-2011 is in our system for the May 20 due date. No issues on our end.',
    receivedAt: '2026-05-24T08:30:00Z',
    unread: false,
    channel: 'email'
  }
];

export const timelineByCustomerId: Record<string, TimelineEvent[]> = {
  'cust-1': [
    {
      id: 'tl-1',
      customerId: 'cust-1',
      type: 'email_received',
      title: 'Customer replied',
      description: 'Sarah asked about credit memo on INV-1042',
      occurredAt: '2026-05-27T09:14:00Z'
    },
    {
      id: 'tl-2',
      customerId: 'cust-1',
      type: 'email_sent',
      title: 'Reminder sent',
      description: 'Friendly overdue notice for INV-1042 and INV-1088',
      occurredAt: '2026-05-25T10:00:00Z'
    },
    {
      id: 'tl-3',
      customerId: 'cust-1',
      type: 'call',
      title: 'Call logged',
      description: 'Left voicemail with AP contact',
      occurredAt: '2026-05-22T15:30:00Z'
    }
  ],
  'cust-3': [
    {
      id: 'tl-4',
      customerId: 'cust-3',
      type: 'email_received',
      title: 'Dispute opened',
      description: 'Quantity mismatch on INV-3301',
      occurredAt: '2026-05-26T16:42:00Z'
    },
    {
      id: 'tl-5',
      customerId: 'cust-3',
      type: 'note',
      title: 'Internal note',
      description: 'Requested warehouse shipping docs',
      occurredAt: '2026-05-26T17:00:00Z'
    }
  ],
  'cust-4': [
    {
      id: 'tl-6',
      customerId: 'cust-4',
      type: 'promise',
      title: 'Payment promised',
      description: 'Committed to pay INV-4402 by May 30',
      occurredAt: '2026-05-26T11:05:00Z'
    }
  ],
  'cust-6': [
    {
      id: 'tl-7',
      customerId: 'cust-6',
      type: 'email_received',
      title: 'Payment plan requested',
      description: 'Asked to split balance into installments',
      occurredAt: '2026-05-25T14:20:00Z'
    },
    {
      id: 'tl-8',
      customerId: 'cust-6',
      type: 'email_sent',
      title: 'Final notice sent',
      description: 'Escalation email for 60+ day balance',
      occurredAt: '2026-05-20T09:00:00Z'
    }
  ]
};

export const agentConfig: AgentConfig = {
  tone: 'professional',
  autoSendEnabled: false,
  escalationRules:
    'Escalate to human review when balance exceeds $25,000, customer is in dispute, or no reply after 3 touches.',
  signature: 'Best regards,\nRevCollect Collections Team'
};

export const integrationStatus: IntegrationStatus = {
  quickbooks: { connected: false, label: 'QuickBooks', detail: 'Not connected' },
  gmail: { connected: false, label: 'Gmail', detail: 'Not connected' },
  stripe: { connected: true, label: 'Stripe', detail: 'Payments syncing' }
};

export const aiDraftByMessageId: Record<string, string> = {
  'msg-1':
    'Hi Sarah,\n\nThank you for the update. I have asked our billing team to confirm whether credit memo CM-204 was applied to INV-1042. I will follow up within one business day with a revised statement.\n\nBest regards,\nRevCollect Collections Team',
  'msg-2':
    'Hi Elena,\n\nThank you for flagging the quantity discrepancy on INV-3301. We are pulling the packing slip and delivery receipt now and will respond with a resolution within 48 hours.\n\nBest regards,\nRevCollect Collections Team',
  'msg-3':
    'Hi James,\n\nThank you for confirming payment by May 30. I have noted the commitment on INV-4402 and attached an updated statement for your records.\n\nBest regards,\nRevCollect Collections Team',
  'msg-4':
    'Hi Tom,\n\nThank you for reaching out. We can offer a three-installment plan on the overdue balance. I will send proposed dates and amounts for your approval shortly.\n\nBest regards,\nRevCollect Collections Team',
  'msg-5':
    'Hi Marcus,\n\nThank you for confirming INV-2011 is scheduled for May 20. No further action is needed at this time.\n\nBest regards,\nRevCollect Collections Team'
};

const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  current: 'Current',
  '1-30': '1–30 days',
  '31-60': '31–60 days',
  '61-90': '61–90 days',
  '90+': '90+ days'
};

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getInvoicesForCustomer(customerId: string): Invoice[] {
  return invoices.filter((i) => i.customerId === customerId);
}

export function getMessagesForCustomer(customerId: string): InboxMessage[] {
  return inboxMessages.filter((m) => m.customerId === customerId);
}

export function getTimelineForCustomer(customerId: string): TimelineEvent[] {
  return timelineByCustomerId[customerId] ?? [];
}

export function getAiDraftForMessage(messageId: string): string {
  return aiDraftByMessageId[messageId] ?? '';
}

export function getAgingBuckets(): AgingBucketSummary[] {
  const buckets: AgingBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];

  return buckets.map((bucket) => {
    const bucketInvoices = invoices.filter((i) => i.agingBucket === bucket);
    return {
      bucket,
      label: AGING_BUCKET_LABELS[bucket],
      invoiceCount: bucketInvoices.length,
      totalCents: bucketInvoices.reduce((sum, i) => sum + i.amountCents, 0)
    };
  });
}

export function getInvoicesByBucket(bucket: AgingBucket): Invoice[] {
  return invoices.filter((i) => i.agingBucket === bucket);
}
