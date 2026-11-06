import type { Customer, Invoice } from '../../types';
import { formatCurrencyWhole, getDaysOverdueFromDueDate } from '../../utils';
import { invoiceAmountDueCents, isOpenCanonicalInvoice } from '../../lib/invoice-open';
import type {
  DashboardActivityItem,
  DashboardAttentionCard,
  DashboardPromiseRow,
  DashboardSnapshot
} from './build-dashboard-snapshot';

const SYNTHETIC_PREVIEW = /\bopen\s*·/;

export interface DashboardCopyInvoice {
  number: string;
  amountLabel: string;
  daysOverdue: number;
}

export interface DashboardCopyAccount {
  customerId: string;
  company: string;
  amountLabel: string;
  daysOverdue: number;
  status: string;
  promisedDate?: string;
  invoices: DashboardCopyInvoice[];
  note?: string;
}

export interface DashboardCopyFacts {
  attention: DashboardCopyAccount[];
  activity: DashboardCopyAccount[];
  promises: DashboardCopyAccount[];
  openInvoiceCount: number;
  totalArLabel: string;
  overdueLabel: string;
  draftCount: number;
  hourLabel: string;
  paymentsLanded: { count: number; amountLabel: string } | null;
  existingBullets: string[];
}

export interface DashboardCopy {
  beats: Record<string, string>;
  summaries: Record<string, string>;
  activity: Record<string, string>;
  promiseNotes: Record<string, string>;
  actions: Record<string, [string, string]>;
  overnight: string[];
}

export function humanInboxNote(preview: string | undefined): string | undefined {
  const text = preview?.replace(/\s+/g, ' ').trim() ?? '';
  if (text.length < 8 || SYNTHETIC_PREVIEW.test(text)) return undefined;
  return text.slice(0, 240);
}

export function copyAccount(
  customer: Customer,
  invoices: Invoice[],
  note?: string
): DashboardCopyAccount {
  const open = invoices
    .filter((invoice) => invoice.customerId === customer.id && isOpenCanonicalInvoice(invoice))
    .toSorted(
      (left, right) =>
        getDaysOverdueFromDueDate(right.dueDate) - getDaysOverdueFromDueDate(left.dueDate)
    )
    .slice(0, 4);

  return {
    customerId: customer.id,
    company: customer.company,
    amountLabel: formatCurrencyWhole(customer.balanceCents),
    daysOverdue: customer.daysOverdue,
    status: customer.status,
    promisedDate: customer.promisedDate?.slice(0, 10),
    invoices: open.map((invoice) => ({
      number: invoice.number,
      amountLabel: formatCurrencyWhole(invoiceAmountDueCents(invoice)),
      daysOverdue: getDaysOverdueFromDueDate(invoice.dueDate)
    })),
    note
  };
}

function invoicePhrase(account: DashboardCopyAccount): string {
  const numbers = account.invoices.map((invoice) => invoice.number);
  if (numbers.length === 0) return 'the open balance';
  if (numbers.length === 1) return `invoice ${numbers[0]}`;
  return `invoices ${numbers.slice(0, 3).join(', ')}`;
}

function withNote(base: string, note?: string): string {
  const sentence = /[.!?]$/.test(base) ? base : `${base}.`;
  if (!note) return sentence;
  return `${sentence} The last note says "${note.replace(/[.]+$/, '')}".`;
}

/** Clause that continues "Company ($amount) …" when the model has not written one yet. */
export function attentionClause(account: DashboardCopyAccount): string {
  const invoices = invoicePhrase(account);
  if (account.status === 'in_dispute') {
    return withNote(`has an open billing dispute on ${invoices}`, account.note);
  }
  if (account.promisedDate && account.daysOverdue > 0) {
    return withNote(
      `promised to pay by ${account.promisedDate}, and ${invoices} is still open ${account.daysOverdue} days later`,
      account.note
    );
  }
  if (account.promisedDate) {
    return withNote(`promised to pay by ${account.promisedDate}`, account.note);
  }
  if (account.daysOverdue > 0) {
    return withNote(`is ${account.daysOverdue} days past due on ${invoices}`, account.note);
  }
  return withNote(`still has an open balance on ${invoices}`, account.note);
}

export function attentionSummary(account: DashboardCopyAccount): string {
  const clause = attentionClause(account);
  return `${account.company} ${clause}`;
}

/** Two chips that follow the same facts as the brief sentence. */
export function recommendedActions(account: DashboardCopyAccount): [string, string] {
  const invoice = account.invoices[0]?.number;
  const followUp = invoice ? `Follow up on ${invoice}` : 'Draft a follow-up';
  const review = invoice ? `Review invoice ${invoice}` : 'Review the balance';
  if (account.status === 'in_dispute') {
    return ['Answer the dispute', review];
  }
  if (account.note && /\bpay(?:ing)? tomorrow\b|\bwill pay\b/i.test(account.note)) {
    return ['Wait until tomorrow', invoice ? `Watch invoice ${invoice}` : 'Confirm the promise'];
  }
  if (account.promisedDate && account.daysOverdue > 0) {
    return ['Check the promise', followUp];
  }
  if (account.promisedDate) {
    return [`Wait until ${account.promisedDate}`, 'Confirm the promise'];
  }
  if (account.daysOverdue > 0) return [followUp, review];
  return ['Review the balance', 'Open the thread'];
}

export function promiseClause(account: DashboardCopyAccount): string | undefined {
  if (account.daysOverdue > 0) {
    return 'the promise date has passed and the balance is still open';
  }
  if (account.promisedDate) return `due ${account.promisedDate}`;
  return undefined;
}

export function readableRunBullet(bullet: string, draftCount: number): string {
  const text = bullet.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (/follow-ups? drafted/i.test(text) && draftCount > 0) {
    return draftCount === 1
      ? 'One follow-up was drafted overnight and is waiting for you to send it.'
      : `${draftCount} follow-ups were drafted overnight and are waiting for you to send them.`;
  }
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

export function applyDashboardCopy(
  snapshot: DashboardSnapshot,
  copy: DashboardCopy | null
): DashboardSnapshot {
  if (!copy) return snapshot;
  return {
    ...snapshot,
    attentionCards: snapshot.attentionCards.map((card) => applyCardCopy(card, copy)),
    activity: snapshot.activity.map((item) => applyActivityCopy(item, copy)),
    promises: snapshot.promises.map((row) => applyPromiseCopy(row, copy)),
    ariBullets: copy.overnight.length > 0 ? copy.overnight : snapshot.ariBullets
  };
}

function applyCardCopy(card: DashboardAttentionCard, copy: DashboardCopy): DashboardAttentionCard {
  return {
    ...card,
    digestBeat: copy.beats[card.customerId] ?? card.digestBeat,
    summary: copy.summaries[card.customerId] ?? card.summary,
    actions: copy.actions?.[card.customerId] ?? card.actions
  };
}

function applyActivityCopy(
  item: DashboardActivityItem,
  copy: DashboardCopy
): DashboardActivityItem {
  return {
    ...item,
    summary: copy.activity[item.customerId] ?? item.summary
  };
}

function applyPromiseCopy(row: DashboardPromiseRow, copy: DashboardCopy): DashboardPromiseRow {
  return {
    ...row,
    note: copy.promiseNotes[row.customerId] ?? row.note
  };
}

export async function requestDashboardCopy(
  facts: DashboardCopyFacts
): Promise<DashboardCopy | null> {
  try {
    const response = await fetch('/api/revcollect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'summarizeDashboard', payload: facts })
    });
    if (!response.ok) throw new Error('Dashboard summary failed');
    const body = (await response.json()) as { copy?: DashboardCopy | null };
    if (!body.copy) throw new Error('Dashboard summary was empty');
    return body.copy;
  } catch {
    return null;
  }
}
