import type { StatusBadgeTone } from '../../components/status-badge';
import { getInboxMessageIdForCustomer } from '../../lib/customer-actions';
import type {
  AgentConfig,
  AgingBucket,
  AgingBucketSummary,
  AgingReportSummary,
  Customer,
  InboxMessage,
  Invoice
} from '../../types';
import { formatCurrencyWhole } from '../../utils';
import { isOpenCanonicalInvoice } from '../../lib/invoice-open';

const PREFERRED_ATTENTION_COMPANIES = ['Rhein Steel', 'Harborline Shipping', 'Nova Energy'];
const PREFERRED_ACTIVITY_COMPANIES = ['BlueRidge Hotels', 'Vertex Systems', 'MediSphere Health'];
const PAYMENT_PATTERN = /payment|paid|remittance|landed/i;
const LEGAL_HOLD_PATTERN = /legal hold/i;
const DISPUTE_PATTERN = /dispute|discrepancy|billing/i;
const ESCALATION_PATTERN = /escalat/i;
const DOLLAR_PATTERN = /\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/g;
const DEFAULT_TERMS_DAYS = 30;
const OVERNIGHT_HOURS = 36;
const WEEK_HOURS = 24 * 7;

export interface DashboardAttentionCard {
  customerId: string;
  company: string;
  inboxMessageId: string | null;
  statusLabel: string;
  statusTone: StatusBadgeTone;
  amountCents: number;
  daysOverdue: number;
  daysLabel: string;
  summary: string;
  actions: [string, string];
}

export interface DashboardAgingBar {
  bucket: AgingBucket;
  label: string;
  totalCents: number;
  percent: number;
}

export interface DashboardKpis {
  totalArCents: number;
  invoiceCount: number;
  collectAtDays: number;
  termsDays: number;
  cashLockedCents: number;
  overdueCents: number;
  collectedThisWeekCents: number;
}

export interface DashboardOvernightPayments {
  count: number;
  amountCents: number;
}

export interface DashboardActivityItem {
  customerId: string;
  company: string;
  summary: string;
  inboxMessageId: string | null;
}

export interface DashboardPromiseRow {
  customerId: string;
  company: string;
  amountCents: number;
  dueLabel: string;
  note?: string;
  inboxMessageId: string | null;
}

export interface DashboardSnapshot {
  overnightPayments: DashboardOvernightPayments | null;
  attentionCards: DashboardAttentionCard[];
  attentionBanner: string | null;
  agingBars: DashboardAgingBar[];
  kpis: DashboardKpis;
  ariBullets: string[];
  ariHourLabel: string;
  activity: DashboardActivityItem[];
  promises: DashboardPromiseRow[];
  hasArData: boolean;
}

export interface BuildDashboardSnapshotInput {
  customers: Customer[];
  invoices: Invoice[];
  inboxMessages: InboxMessage[];
  agingBuckets: AgingBucketSummary[];
  agingSummary: AgingReportSummary | null;
  agentConfig: AgentConfig | null;
  draftCount: number;
  ariRun?: { hourLabel: string; bullets: string[] } | null;
}

function parseCentsFromText(text: string): number[] {
  const amounts: number[] = [];
  const matcher = new RegExp(DOLLAR_PATTERN.source, DOLLAR_PATTERN.flags);
  for (const match of text.matchAll(matcher)) {
    const dollars = Number.parseFloat(match[1].replace(/,/g, ''));
    if (!Number.isNaN(dollars)) {
      amounts.push(Math.round(dollars * 100));
    }
  }
  return amounts;
}

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function isPaymentMessage(message: InboxMessage): boolean {
  return (
    message.replyIntent === 'payment_confirmation' ||
    PAYMENT_PATTERN.test(`${message.subject} ${message.preview}`)
  );
}

function pickByCompany(customers: Customer[], preferred: string[]): Customer[] {
  const byCompany = new Map(customers.map((customer) => [customer.company, customer]));
  return preferred.flatMap((name) => {
    const match = byCompany.get(name);
    return match ? [match] : [];
  });
}

function needsAttention(customer: Customer): boolean {
  return (
    customer.daysOverdue > 0 || customer.status === 'overdue' || customer.status === 'in_dispute'
  );
}

function pickAttentionCustomers(customers: Customer[]): Customer[] {
  const preferred = pickByCompany(customers, PREFERRED_ATTENTION_COMPANIES);
  const seen = new Set(preferred.map((customer) => customer.id));
  const ranked = customers
    .filter((customer) => needsAttention(customer) && !seen.has(customer.id))
    .toSorted((left, right) => right.balanceCents - left.balanceCents);
  return [...preferred, ...ranked].filter(needsAttention).slice(0, 3);
}

function messageText(message: InboxMessage | undefined): string {
  if (!message) return '';
  return `${message.subject} ${message.preview} ${message.suggestedAction ?? ''}`;
}

function inboxMessageIdFor(customerId: string, inboxMessages: InboxMessage[]): string | null {
  return getInboxMessageIdForCustomer(customerId, inboxMessages) ?? null;
}

function buildAttentionCard(
  customer: Customer,
  inboxMessages: InboxMessage[]
): DashboardAttentionCard {
  const message = inboxMessages.find((item) => item.customerId === customer.id);
  const text = messageText(message).toLowerCase();
  const isLegalHold = LEGAL_HOLD_PATTERN.test(text);
  const isDispute =
    customer.status === 'in_dispute' ||
    message?.replyIntent === 'dispute' ||
    DISPUTE_PATTERN.test(text);
  const isEscalation =
    ESCALATION_PATTERN.test(text) || (customer.daysOverdue >= 60 && !isLegalHold && !isDispute);

  let statusLabel = 'Overdue';
  let statusTone: StatusBadgeTone = 'danger';
  if (isLegalHold) {
    statusLabel = 'Legal hold';
    statusTone = 'violet';
  } else if (isEscalation) {
    statusLabel = 'Escalation due';
    statusTone = 'warning';
  } else if (isDispute) {
    statusLabel = 'Dispute reply';
    statusTone = 'info';
  }

  let actions: [string, string];
  if (isLegalHold) {
    actions = ['Call the founder', 'Send final notice'];
  } else if (isEscalation) {
    actions = ['Send escalation', 'Call AP'];
  } else if (isDispute) {
    actions = ['Send reply', 'Review'];
  } else {
    actions = [message?.suggestedAction ?? 'Send follow-up', 'Review'];
  }

  const daysLabel =
    customer.daysOverdue >= 90
      ? `${customer.daysOverdue}d overdue`
      : `oldest ${customer.daysOverdue}d`;

  return {
    customerId: customer.id,
    company: customer.company,
    inboxMessageId: inboxMessageIdFor(customer.id, inboxMessages),
    statusLabel,
    statusTone,
    amountCents: customer.balanceCents,
    daysOverdue: customer.daysOverdue,
    daysLabel,
    summary: message?.preview ?? `${customer.company} needs a collections follow-up.`,
    actions
  };
}

function buildAttentionBanner(cards: DashboardAttentionCard[]): string | null {
  if (cards.length === 0) return null;

  return cards
    .map((card) => {
      const amount = formatCurrencyWhole(card.amountCents);
      if (card.statusLabel === 'Legal hold') {
        return `${card.company} is on legal hold (${amount})`;
      }
      if (card.statusLabel === 'Escalation due') {
        return `${card.company} is ${card.daysOverdue} days overdue (${amount})`;
      }
      if (card.statusLabel === 'Dispute reply') {
        return `${card.company} has a billing discrepancy (${amount})`;
      }
      return `${card.company} is ${card.daysOverdue} days overdue (${amount})`;
    })
    .join('. ');
}

function buildOvernightPayments(
  inboxMessages: InboxMessage[],
  digestBullets: string[]
): DashboardOvernightPayments | null {
  const overnight = inboxMessages.filter(
    (message) => hoursAgo(message.receivedAt) <= OVERNIGHT_HOURS && isPaymentMessage(message)
  );
  const overnightCents = overnight.flatMap((message) =>
    parseCentsFromText(`${message.subject} ${message.preview}`)
  );
  const digestPaymentBullets = digestBullets.filter((bullet) => PAYMENT_PATTERN.test(bullet));
  const digestCents = digestPaymentBullets.flatMap(parseCentsFromText);

  const count = overnight.length || digestPaymentBullets.length;
  const amountCents =
    overnightCents.reduce((sum, value) => sum + value, 0) ||
    digestCents.reduce((sum, value) => sum + value, 0);

  if (count === 0 && amountCents === 0) return null;
  return { count: Math.max(count, amountCents > 0 ? 1 : 0), amountCents };
}

function collectedThisWeekCents(
  inboxMessages: InboxMessage[],
  digestBullets: string[],
  overnight: DashboardOvernightPayments | null
): number {
  const weekly = inboxMessages.filter(
    (message) => hoursAgo(message.receivedAt) <= WEEK_HOURS && isPaymentMessage(message)
  );
  const fromInbox = weekly
    .flatMap((message) => parseCentsFromText(`${message.subject} ${message.preview}`))
    .reduce((sum, value) => sum + value, 0);
  const fromDigest = digestBullets
    .filter((bullet) => PAYMENT_PATTERN.test(bullet))
    .flatMap(parseCentsFromText)
    .reduce((sum, value) => sum + value, 0);

  return fromInbox || fromDigest || overnight?.amountCents || 0;
}

function promiseDueLabel(message: InboxMessage | undefined): string {
  const label = message?.replyIntentLabel ?? '';
  const byMatch = label.match(/by\s+(.+)$/i);
  if (byMatch?.[1]) return byMatch[1];
  if (message && hoursAgo(message.receivedAt) < 24) return 'Today';
  return 'Upcoming';
}

export function buildDashboardSnapshot(input: BuildDashboardSnapshotInput): DashboardSnapshot {
  const {
    customers,
    invoices,
    inboxMessages,
    agingBuckets,
    agingSummary,
    agentConfig,
    draftCount,
    ariRun
  } = input;

  const attentionCards = pickAttentionCustomers(customers).map((customer) =>
    buildAttentionCard(customer, inboxMessages)
  );

  const totalArCents =
    agingSummary?.totalArCents ?? agingBuckets.reduce((sum, bucket) => sum + bucket.totalCents, 0);
  const overdueCents = agingSummary?.overdueCents ?? 0;
  const collectAtDays = agingSummary?.weightedAvgDsoDays ?? 0;
  const extraDays = Math.max(0, collectAtDays - DEFAULT_TERMS_DAYS);
  const cashLockedCents = Math.round((totalArCents * extraDays) / Math.max(collectAtDays, 1));
  const invoiceCount =
    invoices.filter(isOpenCanonicalInvoice).length ||
    agingBuckets.reduce((sum, bucket) => sum + bucket.invoiceCount, 0);

  const digestBullets = ariRun?.bullets ?? agentConfig?.digestPreview.bullets ?? [];
  const overnightPayments = buildOvernightPayments(inboxMessages, digestBullets);

  const ariBullets = [...digestBullets];
  if (draftCount > 0 && !ariBullets.some((bullet) => /draft/i.test(bullet))) {
    ariBullets.push(`${draftCount} follow-up${draftCount === 1 ? '' : 's'} drafted overnight`);
  }

  const digestHour = agentConfig?.behaviors.digestHour ?? 6;
  const hour = ((digestHour + 11) % 12) + 1;
  const meridiem = digestHour >= 12 ? 'PM' : 'AM';
  const ariHourLabel = ariRun?.hourLabel ?? `${hour}:00 ${meridiem}`;

  const preferredActivity = pickByCompany(customers, PREFERRED_ACTIVITY_COMPANIES);
  const activitySource =
    preferredActivity.length > 0
      ? preferredActivity
      : customers.filter((customer) => customer.balanceCents > 0).slice(0, 3);

  const activity: DashboardActivityItem[] = activitySource.slice(0, 3).map((customer) => {
    const message = inboxMessages.find((item) => item.customerId === customer.id);
    return {
      customerId: customer.id,
      company: customer.company,
      summary:
        message?.preview ?? `${customer.company} is ${customer.status.replaceAll('_', ' ')}.`,
      inboxMessageId: inboxMessageIdFor(customer.id, inboxMessages)
    };
  });

  const promises: DashboardPromiseRow[] = customers
    .filter((customer) => customer.status === 'promised')
    .toSorted((left, right) => right.balanceCents - left.balanceCents)
    .slice(0, 4)
    .map((customer) => {
      const message = inboxMessages.find((item) => item.customerId === customer.id);
      return {
        customerId: customer.id,
        company: customer.company,
        amountCents: customer.balanceCents,
        dueLabel: promiseDueLabel(message),
        note: customer.daysOverdue > 0 ? 'broken, follow up shown' : undefined,
        inboxMessageId: inboxMessageIdFor(customer.id, inboxMessages)
      };
    });

  const agingBars: DashboardAgingBar[] = agingBuckets.map((bucket) => ({
    bucket: bucket.bucket,
    label: bucket.label,
    totalCents: bucket.totalCents,
    percent: totalArCents > 0 ? Math.round((bucket.totalCents / totalArCents) * 100) : 0
  }));

  return {
    overnightPayments,
    attentionCards,
    attentionBanner: buildAttentionBanner(attentionCards),
    agingBars,
    kpis: {
      totalArCents,
      invoiceCount,
      collectAtDays,
      termsDays: DEFAULT_TERMS_DAYS,
      cashLockedCents,
      overdueCents,
      collectedThisWeekCents: collectedThisWeekCents(
        inboxMessages,
        digestBullets,
        overnightPayments
      )
    },
    ariBullets,
    ariHourLabel,
    activity,
    promises,
    hasArData: totalArCents > 0 || customers.length > 0
  };
}
