import { COLLECTIONS_AGENT } from './constants';
import type {
  AgentDraftMeta,
  AgentDraftTone,
  CollectionStatus,
  Customer,
  EmailAttachment,
  InboxMessage,
  ReplyIntent,
  ThreadEmail
} from './types';

const SIGNATURE = '\n\nBest regards,\nRevCollect Collections Team';

type TurnAttachmentInput = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

type TurnInput = {
  author: 'customer' | 'agent';
  body: string;
  hoursBeforeLatest: number;
  cc?: string[];
  attachments?: TurnAttachmentInput[];
};

type ScenarioTemplate = {
  subject: string;
  preview: string;
  unread: boolean;
  daysAgo: number;
  summary: string;
  draft: string;
  turns: TurnInput[];
  replyIntent?: ReplyIntent;
  replyIntentLabel?: string;
  agentDraftReady?: boolean;
  suggestedAction?: string;
  draftTitle?: string;
  draftPreparedAtLabel?: string;
  draftTone?: AgentDraftTone;
};

function agentBody(greeting: string, paragraphs: string[]): string {
  return `${greeting}\n\n${paragraphs.join('\n\n')}\n\nBest regards,\nRevCollect Collections Team`;
}

function customerBody(greeting: string, paragraphs: string[], signOff = 'Thank you'): string {
  return `${greeting}\n\n${paragraphs.join('\n\n')}\n\n${signOff}`;
}

function replySubject(subject: string, isFirstInThread: boolean): string {
  const base = subject.replace(/^Re:\s*/i, '');
  return isFirstInThread ? subject : `Re: ${base}`;
}

function mapAttachments(
  threadId: string,
  turnIndex: number,
  items?: TurnAttachmentInput[]
): EmailAttachment[] | undefined {
  if (!items?.length) return undefined;
  return items.map((item, attIndex) => ({
    id: `${threadId}-turn-${turnIndex + 1}-att-${attIndex + 1}`,
    filename: item.filename,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes
  }));
}

const scenarioByStatus: Record<CollectionStatus, ScenarioTemplate> = {
  overdue: {
    subject: 'Overdue balance follow-up',
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
        body: agentBody('Hello,', [
          'I hope this message finds you well.',
          'Our records show an overdue balance on your account. Please let us know when payment can be released, or if any invoices require clarification from our billing team.',
          'I have attached a current aging statement for your review.'
        ]),
        attachments: [
          {
            filename: 'aging_statement.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 248_000
          }
        ]
      },
      {
        author: 'customer',
        hoursBeforeLatest: 48,
        body: customerBody('Hello,', [
          'Thank you for sending the aging statement.',
          'Our accounts payable team is reviewing the invoice packet internally before payment can be scheduled. We expect to have an update within the next few business days.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: agentBody('Hello,', [
          'Thank you for the update.',
          'Can you confirm whether any invoices are currently under internal dispute, or if the hold is strictly timing-related?'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 2,
        body: customerBody('Hello,', [
          'AP is still reviewing the open invoices before releasing payment.',
          'Could you confirm whether prior credits were applied to the oldest open items? We want to make sure our records match yours before we remit.'
        ])
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
        body: agentBody('Hello,', [
          'Please confirm receipt of the latest invoice and your expected payment timing.',
          'If helpful, I can resend remittance instructions or a consolidated statement.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 72,
        body: customerBody('Hi,', [
          'We received the invoice and added it to our AP queue for the upcoming due date.',
          'No discrepancies noted on our side at this time.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: agentBody('Hello,', [
          'Thank you for confirming receipt.',
          'When you have a moment, please share the expected remittance date so we can update our records.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 4,
        body: customerBody('Hi,', [
          'The invoice is in our system and scheduled for payment on the due date.',
          'We do not anticipate any issues on our end.'
        ])
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
        body: agentBody('Hello,', [
          'We noticed payment has not been released on a disputed invoice on your account.',
          'Could you share the reason for the hold and which invoice numbers are affected?'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 96,
        body: customerBody('Hello,', [
          'We identified a billing discrepancy and have paused payment until our records are reconciled with yours.',
          'Our warehouse team is comparing received quantities against the billed amounts.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 48,
        body: agentBody('Hello,', [
          'Understood — thank you for the context.',
          'Please share the specific line items in question so we can investigate and respond with corrected documentation.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 6,
        body: customerBody('Hello,', [
          'We are holding payment until the billing discrepancy is reconciled.',
          'Please send corrected documentation. I have attached our copy of the packing slip for reference.'
        ]),
        attachments: [
          {
            filename: 'packing_slip_disputed_invoice.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 312_000
          }
        ]
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
        body: agentBody('Hello,', [
          'Following up on the open balance on your account.',
          'Can you confirm when payment will be released?'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 48,
        body: customerBody('Hi,', [
          'We can commit to payment by the end of this week once treasury approves the disbursement run.',
          'I will send written confirmation as soon as the date is locked.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: agentBody('Hello,', [
          'Thank you — that is helpful.',
          'Please confirm the exact date so we can update our records and pause further reminders.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 3,
        body: customerBody('Hi,', [
          'We can honor payment by the committed date pending treasury approval.',
          'Please send an updated statement reflecting the commitment on file.'
        ])
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
        body: agentBody('Hello,', [
          'Sharing your upcoming invoice summary for visibility.',
          'Please confirm receipt and let us know if you need updated remittance instructions.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 72,
        body: customerBody('Hello,', [
          'Received — thank you.',
          'We will process this with our normal AP cycle.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: agentBody('Hello,', [
          'Thank you for confirming.',
          'Reach out anytime if you need remittance details or a consolidated statement.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 8,
        body: customerBody('Hello,', [
          'No open issues on our side for the upcoming invoice cycle.',
          'We will use the remittance instructions on file.'
        ])
      }
    ]
  }
};

const statusOverrides: Partial<Record<string, Partial<ScenarioTemplate>>> = {
  'cust-1': {
    subject: 'Invoice INV-1042 — payment timing',
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
      'Hi Elena,\n\nThank you for flagging the quantity discrepancy on INV-3301. We are pulling the packing slip and delivery receipt now and will respond with a resolution within 48 hours.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 120,
        body: agentBody('Hi Elena,', [
          'We are following up on INV-3301, which remains open on your account.',
          'Could you confirm why payment has been held and which line items are in question?'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 96,
        body: customerBody('Hi,', [
          'The quantity on the packing slip does not match what we received in the warehouse.',
          'We have paused payment on INV-3301 until the billing record is corrected.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 48,
        body: agentBody('Hi Elena,', [
          'Thank you for the detail.',
          'Please forward any receiving documents you have so we can reconcile with our shipment records.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 6,
        body: customerBody('Hi,', [
          'Please see the attached packing slip and receiving log for INV-3301.',
          'We are available for a call if your team needs to walk through the variance.'
        ]),
        attachments: [
          {
            filename: 'packing_slip_INV-3301.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 284_500
          },
          {
            filename: 'receiving_log_INV-3301.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            sizeBytes: 96_200
          }
        ]
      }
    ]
  },
  'cust-6': {
    subject: 'Need payment plan options',
    preview: 'Cash flow is tight this quarter. Can we split the overdue balance...',
    unread: true,
    replyIntent: 'deflection',
    replyIntentLabel: 'Deflection',
    agentDraftReady: true,
    suggestedAction: 'Send a follow-up addressing their installment request',
    draftTitle: 'Approve installment plan with 3-month timeline',
    draftPreparedAtLabel: '6:00 AM',
    draftTone: 'professional',
    summary:
      'Tom requested a three-installment plan due to cash-flow constraints on a 60+ day balance. Escalation notice was previously sent.',
    draft:
      "Hi Tom,\n\nThank you for reaching out. Based on our previous arrangements, we can offer a three-installment plan:\n\nInstallment 1: $15,000 by June 11\nInstallment 2: $15,000 by July 11\nInstallment 3: $11,200 by August 11\n\nBoth prior installment plans were completed on schedule, so we're confident this will work well. Please confirm and I'll prepare the formal agreement.",
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 20,
        body: agentBody('Hi Tom,', [
          'Following up on the overdue balance of $41,200 across three invoices. Please advise when payment can be released.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 4,
        body: customerBody('Hi,', [
          'Cash flow is tight this quarter. Can we split the overdue balance into three installments?',
          'We can commit to the first payment within ten business days.'
        ])
      }
    ]
  },
  'cust-4': {
    subject: 'Re: INV-4201 payment confirmation',
    preview: 'We can honor payment by the committed date pending treasury approval...',
    unread: false,
    replyIntent: 'promise',
    replyIntentLabel: 'Promise By May 30',
    agentDraftReady: false,
    suggestedAction: 'Monitor commitment — payment due May 30',
    summary:
      'James confirmed payment for INV-4201 by May 30 pending treasury approval. No follow-up needed unless date slips.',
    draft:
      'Hi James,\n\nThank you for confirming the payment commitment. I have noted May 30 on your account and will send an updated statement for your records.'
  },
  'cust-9': {
    subject: 'Partial payment sent for INV-9103',
    preview: 'We processed a partial payment today and need confirmation on remaining balance...',
    summary:
      'David sent a partial payment of $5,000 toward INV-9103 and asked about fee waiver on the remaining $3,300 balance.',
    draft:
      'Hi David,\n\nThank you for confirming the partial payment. We have applied the $5,000 remittance and the remaining balance is $3,300 across INV-9103 and INV-9114.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 72,
        body: agentBody('Hi David,', [
          'Please find the attached aging summary for INV-9103 and INV-9114.',
          'Let us know if you have questions before remitting the remaining balance.'
        ]),
        attachments: [
          {
            filename: 'aging_statement.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 221_000
          }
        ]
      },
      {
        author: 'customer',
        hoursBeforeLatest: 8,
        body: customerBody('Hi,', [
          'We processed a partial payment of $5,000 today via ACH.',
          'Please confirm receipt and advise whether any late fees can be waived on the remaining $3,300 balance.'
        ]),
        attachments: [
          {
            filename: 'remittance_advice.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 142_300
          }
        ]
      }
    ]
  },
  'cust-10': {
    subject: 'Invalid PO on INV-10055',
    preview: 'Our AP team flagged an invalid PO on invoice INV-10055...',
    summary:
      'Maya flagged an invalid PO on INV-10055. Billing is validating the purchase order before payment release.',
    draft:
      'Hi Maya,\n\nThank you for flagging the PO issue on INV-10055. We are validating the purchase order with your account owner and will send corrected billing within 48 hours.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 120,
        body: agentBody('Hello,', [
          'We noticed payment has not been released on a disputed invoice on your account.',
          'Could you share the reason for the hold and which invoice numbers are affected?'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 96,
        body: customerBody('Hello,', [
          'Our accounts payable team flagged an invalid PO on invoice INV-10055.',
          'We have paused payment until the PO is corrected on your billing record.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 48,
        body: agentBody('Hello,', [
          'Thank you for the detail.',
          'We are pulling the PO validation from your account owner and will respond with corrected documentation.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 6,
        body: customerBody('Hello,', [
          'Please confirm once INV-10055 reflects the correct PO so we can release payment.',
          'I have attached our AP hold notice for reference.'
        ]),
        attachments: [
          {
            filename: 'ap_hold_notice_INV-10055.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 186_400
          }
        ]
      }
    ]
  },
  'cust-16': {
    subject: 'Request for installment plan on legacy balance',
    preview: 'Can we split the oldest invoices over a 6-week payment schedule?',
    summary:
      'Iris requested a three-part payment plan for 90+ day legacy invoices. Finance call is scheduled with their controller.',
    draft:
      'Hi Iris,\n\nThanks for the payment-plan request. We can offer a 3-installment structure over six weeks for INV-16001 and INV-16008.'
  },
  'cust-23': {
    subject: 'AP contact change — overdue approvals',
    preview: 'Our new AP manager is now handling overdue invoice approvals...',
    unread: true,
    replyIntent: 'deflection',
    replyIntentLabel: 'Deflection',
    agentDraftReady: true,
    suggestedAction: 'Resend escalation package to new AP contact',
    draftTitle: 'Confirm receipt with new AP manager',
    draftPreparedAtLabel: '6:00 AM',
    draftTone: 'firm',
    summary:
      'Hannah shared a new AP contact. Escalation package with aging statement was sent to unblock overdue approvals.',
    draft:
      'Hi Hannah,\n\nThank you for introducing your new AP manager. I have resent the escalation package and aging statement for the overdue invoices pending approval.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 72,
        body: agentBody('Hi Hannah,', [
          'Please find attached the escalation package and aging statement for overdue invoices on your account.',
          'We need approval on the open items so we can close the aging bucket this month.'
        ]),
        attachments: [
          {
            filename: 'escalation_package.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 312_000
          },
          {
            filename: 'aging_statement.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 245_600
          }
        ]
      },
      {
        author: 'customer',
        hoursBeforeLatest: 48,
        body: customerBody('Hi,', [
          'Our accounts payable team is reviewing the invoice packet internally before payment can be scheduled.',
          'We expect to have an update within the next few business days.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: agentBody('Hi Hannah,', [
          'Thank you for the update.',
          'Can you confirm whether any invoices are currently under internal dispute, or if the hold is strictly timing-related?'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 2,
        body: customerBody('Hi,', [
          'Our new AP manager is now handling overdue invoice approvals on this account.',
          'Please route future statements and escalation notices to ap.manager@blueridgehotels.com.'
        ])
      }
    ]
  },
  'cust-24': {
    subject: 'Short-pay on INV-24012 — freight deduction',
    preview: 'We short-paid INV-24012 due to a freight overcharge on the shipment...',
    summary:
      'Oliver explained a freight overcharge deduction on INV-24012. Finance is validating the freight claim before releasing the remainder.',
    draft:
      'Hi Oliver,\n\nThank you for explaining the freight deduction on INV-24012. Our finance team is validating the freight claim and will respond with a credit or revised balance within two business days.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 120,
        body: agentBody('Hello,', [
          'We noticed payment has not been released on a disputed invoice on your account.',
          'Could you share the reason for the hold and which invoice numbers are affected?'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 96,
        body: customerBody('Hello,', [
          'We short-paid INV-24012 due to a freight overcharge on the shipment.',
          'Please review the attached freight claim summary and advise on the corrected balance.'
        ]),
        attachments: [
          {
            filename: 'freight_claim_summary.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 224_800
          }
        ]
      },
      {
        author: 'agent',
        hoursBeforeLatest: 48,
        body: agentBody('Hello,', [
          'Understood — thank you for the context.',
          'Please share the specific line items in question so we can investigate and respond with corrected documentation.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 6,
        body: customerBody('Hello,', [
          'We are holding the remainder until the freight claim is reconciled.',
          'Please send corrected documentation when your team completes the review.'
        ])
      }
    ]
  },
  'cust-26': {
    subject: 'Legal hold notice on oldest invoices',
    preview: 'Our counsel requested temporary hold while contract terms are reviewed.',
    unread: true,
    summary:
      'Lucas placed a legal hold on pre-February invoices while counsel reviews service-level terms. Automated outreach is paused.',
    draft:
      'Hi Lucas,\n\nThank you for the legal hold notice. We have paused automated outreach on the affected invoices and moved this account to managed review.',
    turns: [
      {
        author: 'agent',
        hoursBeforeLatest: 96,
        body: agentBody('Hi Lucas,', [
          'Following up on the overdue balance on pre-February invoices on your account.',
          'Please advise when payment can be released or if any items require escalation.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 72,
        body: customerBody('Hi,', [
          'Our counsel has requested a temporary legal hold on the oldest invoices while contract terms are reviewed.',
          'Please pause automated outreach on pre-February items until we provide written clearance.'
        ])
      },
      {
        author: 'agent',
        hoursBeforeLatest: 24,
        body: agentBody('Hi Lucas,', [
          'Thank you for the legal hold notice.',
          'We have paused automated outreach on the affected invoices and moved this account to managed review.'
        ])
      },
      {
        author: 'customer',
        hoursBeforeLatest: 4,
        body: customerBody('Hi,', [
          'Confirming receipt of your acknowledgment.',
          'We will follow up once counsel completes the contract review.'
        ])
      }
    ]
  }
};

function addHours(isoBase: string, hours: number): string {
  const date = new Date(isoBase);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

/** Spread receivedAt across inbox date sections for dev/demo. */
function daysAgoForInboxIndex(index: number): number {
  if (index < 2) return 0;
  if (index < 10) return 1 + ((index - 2) % 7);
  if (index < 18) return 8 + ((index - 10) % 23);
  const monthlyOffsets = [35, 38, 42, 45, 52, 58, 65, 72, 78, 88, 95, 105];
  return monthlyOffsets[index - 18] ?? 45 + (index - 18) * 8;
}

function deriveStatusDefaults(
  customer: Customer,
  index: number,
  template: ScenarioTemplate
): Partial<ScenarioTemplate> {
  if (template.replyIntent) {
    return {};
  }

  switch (customer.status) {
    case 'promised': {
      const promiseDate = new Date();
      promiseDate.setDate(promiseDate.getDate() + 14);
      const monthDay = promiseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        replyIntent: 'promise',
        replyIntentLabel: `Promise By ${monthDay}`
      };
    }
    case 'in_dispute':
      return {
        replyIntent: 'dispute',
        replyIntentLabel: 'Dispute'
      };
    case 'overdue':
      if (template.unread && index % 3 === 0) {
        return {
          replyIntent: 'deflection',
          replyIntentLabel: 'Deflection',
          agentDraftReady: true,
          draftTitle: 'Send follow-up',
          draftPreparedAtLabel: '6:00 AM',
          draftTone: 'professional'
        };
      }
      return {};
    default:
      return {};
  }
}

function buildThreadsForCustomers(customers: Customer[]): {
  inboxMessages: InboxMessage[];
  threadEmailsByThreadId: Record<string, ThreadEmail[]>;
  aiSummaryByThreadId: Record<string, string>;
  aiDraftByMessageId: Record<string, string>;
  agentDraftMetaByMessageId: Record<string, AgentDraftMeta>;
} {
  const inboxMessages: InboxMessage[] = [];
  const threadEmailsByThreadId: Record<string, ThreadEmail[]> = {};
  const aiSummaryByThreadId: Record<string, string> = {};
  const aiDraftByMessageId: Record<string, string> = {};
  const agentDraftMetaByMessageId: Record<string, AgentDraftMeta> = {};
  const agentFrom = COLLECTIONS_AGENT.email;

  customers.forEach((customer, index) => {
    const threadId = `msg-${index + 1}`;
    const baseTemplate = scenarioByStatus[customer.status];
    const override = statusOverrides[customer.id] ?? {};
    const template = {
      ...baseTemplate,
      ...override,
      ...deriveStatusDefaults(customer, index, {
        ...baseTemplate,
        ...override,
        turns: override.turns ?? baseTemplate.turns
      }),
      turns: override.turns ?? baseTemplate.turns
    };

    const receivedAt = new Date();
    receivedAt.setDate(receivedAt.getDate() - daysAgoForInboxIndex(index));
    receivedAt.setHours(9 + (index % 6), 14, 0, 0);
    const receivedAtIso = receivedAt.toISOString();

    const draftBody = `${template.draft}${SIGNATURE}`;
    const agentDraftReady = template.agentDraftReady ?? index < 2;

    inboxMessages.push({
      id: threadId,
      customerId: customer.id,
      subject: template.subject,
      preview: template.preview,
      receivedAt: receivedAtIso,
      unread: template.unread,
      channel: 'email',
      replyIntent: template.replyIntent,
      replyIntentLabel: template.replyIntentLabel,
      agentDraftReady,
      suggestedAction: template.suggestedAction
    });

    threadEmailsByThreadId[threadId] = template.turns.map((turn, turnIndex) => {
      const isAgent = turn.author === 'agent';
      const from = isAgent ? agentFrom : customer.email;
      const to = isAgent ? [customer.email] : [agentFrom];

      return {
        id: `${threadId}-turn-${turnIndex + 1}`,
        threadId,
        author: turn.author,
        from,
        to,
        cc: turn.cc,
        subject: replySubject(template.subject, turnIndex === 0),
        body: turn.body,
        sentAt: addHours(receivedAtIso, turn.hoursBeforeLatest),
        attachments: mapAttachments(threadId, turnIndex, turn.attachments)
      };
    });

    aiSummaryByThreadId[threadId] = template.summary;
    aiDraftByMessageId[threadId] = draftBody;

    if (agentDraftReady) {
      agentDraftMetaByMessageId[threadId] = {
        title: template.draftTitle ?? 'Send follow-up',
        preparedAtLabel: template.draftPreparedAtLabel ?? '6:00 AM',
        body: draftBody,
        tone: template.draftTone ?? 'professional'
      };
    }
  });

  return {
    inboxMessages,
    threadEmailsByThreadId,
    aiSummaryByThreadId,
    aiDraftByMessageId,
    agentDraftMetaByMessageId
  };
}

export function createInboxThreadData(customers: Customer[]) {
  return buildThreadsForCustomers(customers);
}
