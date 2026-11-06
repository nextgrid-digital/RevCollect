import { createHash } from 'node:crypto';
import { generateGeminiText, geminiModelId, isGeminiConfigured } from '@/lib/ai/gemini';
import type {
  DashboardCopy,
  DashboardCopyAccount,
  DashboardCopyFacts,
  DashboardCopyInvoice
} from '@/features/revcollect/dashboard/lib/dashboard-copy';

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; copy: DashboardCopy }>();

const SYSTEM = [
  'You write the morning dashboard for a collections agent named ARI.',
  'Return only JSON with keys beats, summaries, activity, promiseNotes, actions, and overnight.',
  'beats, summaries, activity, promiseNotes, and actions are objects keyed by the customerId from the facts.',
  'A beat continues a sentence that already starts with the company name and the amount. Start it with a lowercase verb such as is, has, or promised. Do not repeat the company name or the amount.',
  'A summary is one or two complete sentences on that account card. Name the invoice when the facts include one. Say what is going on in words. Never answer with only an amount and an invoice number.',
  'An activity line is one short sentence for the queue row under the company name. It must not be the same sentence as the summary.',
  'A promise note is a short clause after the amount, with no company name.',
  'actions[customerId] is exactly two short labels, two to five words, for the next step that follows the beat you wrote.',
  'If the beat says they promised to pay on a date, the first label waits for or confirms that promise. Do not recommend a follow-up draft for that account.',
  'If the beat says an invoice is past due and there is no promise, the first label names that invoice, such as Follow up on 1036.',
  'overnight is one to four complete sentences about this morning. Use the run facts and the accounts. Name a company only when that company is in the facts. Do not invent payments, legal holds, disputes, replies, or counts.',
  'Use only the facts. Do not invent amounts, dates, invoice numbers, or names. Do not include an email address. Do not tell anyone to send mail.'
].join(' ');

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readInvoice(value: unknown): DashboardCopyInvoice | null {
  const row = asRecord(value);
  if (!row || typeof row.number !== 'string' || typeof row.amountLabel !== 'string') return null;
  if (typeof row.daysOverdue !== 'number' || !Number.isFinite(row.daysOverdue)) return null;
  return {
    number: row.number.slice(0, 24),
    amountLabel: row.amountLabel.slice(0, 20),
    daysOverdue: Math.max(0, Math.round(row.daysOverdue))
  };
}

function readAccount(value: unknown): DashboardCopyAccount | null {
  const row = asRecord(value);
  if (!row) return null;
  if (typeof row.customerId !== 'string' || typeof row.company !== 'string') return null;
  if (typeof row.amountLabel !== 'string' || typeof row.status !== 'string') return null;
  if (typeof row.daysOverdue !== 'number' || !Number.isFinite(row.daysOverdue)) return null;
  const company = row.company.trim().slice(0, 80);
  const customerId = row.customerId.trim().slice(0, 80);
  if (!company || !customerId) return null;
  const invoices = Array.isArray(row.invoices)
    ? row.invoices.flatMap((invoice) => {
        const parsed = readInvoice(invoice);
        return parsed ? [parsed] : [];
      })
    : [];
  return {
    customerId,
    company,
    amountLabel: row.amountLabel.trim().slice(0, 20),
    daysOverdue: Math.max(0, Math.round(row.daysOverdue)),
    status: row.status.trim().slice(0, 40),
    promisedDate:
      typeof row.promisedDate === 'string' ? row.promisedDate.trim().slice(0, 10) : undefined,
    invoices: invoices.slice(0, 4),
    note: typeof row.note === 'string' ? row.note.trim().slice(0, 240) : undefined
  };
}

function readAccounts(value: unknown, limit: number): DashboardCopyAccount[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      const account = readAccount(item);
      return account ? [account] : [];
    })
    .slice(0, limit);
}

export function readDashboardCopyFacts(value: unknown): DashboardCopyFacts | null {
  const row = asRecord(value);
  if (!row) return null;
  const payments = asRecord(row.paymentsLanded);
  const paymentsLanded =
    payments &&
    typeof payments.count === 'number' &&
    Number.isFinite(payments.count) &&
    typeof payments.amountLabel === 'string'
      ? {
          count: Math.max(0, Math.round(payments.count)),
          amountLabel: payments.amountLabel.trim().slice(0, 20)
        }
      : null;
  const facts: DashboardCopyFacts = {
    attention: readAccounts(row.attention, 3),
    activity: readAccounts(row.activity, 3),
    promises: readAccounts(row.promises, 4),
    openInvoiceCount:
      typeof row.openInvoiceCount === 'number' && Number.isFinite(row.openInvoiceCount)
        ? Math.max(0, Math.round(row.openInvoiceCount))
        : 0,
    totalArLabel: typeof row.totalArLabel === 'string' ? row.totalArLabel.slice(0, 20) : '',
    overdueLabel: typeof row.overdueLabel === 'string' ? row.overdueLabel.slice(0, 20) : '',
    draftCount:
      typeof row.draftCount === 'number' && Number.isFinite(row.draftCount)
        ? Math.max(0, Math.round(row.draftCount))
        : 0,
    hourLabel: typeof row.hourLabel === 'string' ? row.hourLabel.slice(0, 20) : '',
    paymentsLanded,
    existingBullets: Array.isArray(row.existingBullets)
      ? row.existingBullets
          .filter((bullet): bullet is string => typeof bullet === 'string')
          .map((bullet) => bullet.trim().slice(0, 180))
          .filter(Boolean)
          .slice(0, 6)
      : []
  };
  if (
    facts.attention.length === 0 &&
    facts.activity.length === 0 &&
    facts.promises.length === 0 &&
    facts.draftCount === 0
  ) {
    return null;
  }
  return facts;
}

function accountsById(facts: DashboardCopyFacts): Map<string, DashboardCopyAccount> {
  const map = new Map<string, DashboardCopyAccount>();
  for (const account of [...facts.attention, ...facts.activity, ...facts.promises]) {
    map.set(account.customerId, account);
  }
  return map;
}

function allowedMoney(facts: DashboardCopyFacts): Set<string> {
  const labels = [facts.totalArLabel, facts.overdueLabel, facts.paymentsLanded?.amountLabel ?? ''];
  for (const account of [...facts.attention, ...facts.activity, ...facts.promises]) {
    labels.push(account.amountLabel);
    for (const invoice of account.invoices) labels.push(invoice.amountLabel);
  }
  return new Set(labels.filter(Boolean));
}

function hasUnknownMoney(text: string, allowed: Set<string>): boolean {
  const amounts = text.match(/\$[0-9][0-9,]*/g) ?? [];
  return amounts.some((amount) => !allowed.has(amount));
}

function hasUnknownNumber(text: string, allowed: Set<string>): boolean {
  const numbers = text.match(/\d{2,}/g) ?? [];
  return numbers.some((number) => !allowed.has(number));
}

function cleanClause(value: unknown, account: DashboardCopyAccount): string | null {
  if (typeof value !== 'string') return null;
  let text = value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["']|["']$/g, '');
  const company = account.company.toLowerCase();
  if (text.toLowerCase().startsWith(company)) {
    text = text.slice(account.company.length).replace(/^[\s,.:—-]+/, '');
  }
  text = text.replace(/[.]+$/, '').trim();
  if (text.length < 12 || text.length > 220) return null;
  if (/@|https?:|open\s*·/i.test(text)) return null;
  if (!/^[a-z(]/.test(text)) text = text.charAt(0).toLowerCase() + text.slice(1);
  if (!/^[a-z(]/.test(text)) return null;
  return text;
}

function cleanSentence(value: unknown, max: number, numbers: Set<string>): string | null {
  if (typeof value !== 'string') return null;
  let text = value.replace(/\s+/g, ' ').trim();
  if (!/[.!?]$/.test(text)) text = `${text}.`;
  if (text.length < 12 || text.length > max) return null;
  if (/@|https?:|open\s*·/i.test(text)) return null;
  if (hasUnknownNumber(text, numbers)) return null;
  return text;
}

function cleanActionLabel(value: unknown, numbers: Set<string>): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');
  if (text.length < 4 || text.length > 36) return null;
  if (/@|https?:|\$|send mail/i.test(text)) return null;
  if (hasUnknownNumber(text, numbers)) return null;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function cleanActionPair(value: unknown, numbers: Set<string>): [string, string] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const first = cleanActionLabel(value[0], numbers);
  const second = cleanActionLabel(value[1], numbers);
  if (!first || !second || first.toLowerCase() === second.toLowerCase()) return null;
  return [first, second];
}

function cleanPromiseNote(value: unknown, account: DashboardCopyAccount): string | null {
  if (typeof value !== 'string') return null;
  let text = value.replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');
  if (text.toLowerCase().startsWith(account.company.toLowerCase())) return null;
  if (text.length < 8 || text.length > 90) return null;
  if (/@|https?:|\$/.test(text)) return null;
  return text;
}

function numbersInFacts(facts: DashboardCopyFacts): Set<string> {
  const allowed = new Set<string>();
  for (const match of JSON.stringify(facts).matchAll(/\d{2,}/g)) {
    allowed.add(match[0]);
  }
  return allowed;
}

function textMap(value: unknown): Record<string, unknown> {
  const row = asRecord(value);
  if (row) return row;
  if (!Array.isArray(value)) return {};
  const mapped: Record<string, unknown> = {};
  for (const item of value) {
    const record = asRecord(item);
    if (!record) continue;
    const id = record.customerId ?? record.id ?? record.company;
    const text = record.text ?? record.summary ?? record.line ?? record.beat ?? record.note;
    if (typeof id === 'string' && (typeof text === 'string' || typeof text === 'number')) {
      mapped[id] = text;
    }
  }
  return mapped;
}

function textFor(map: Record<string, unknown>, account: DashboardCopyAccount): unknown {
  return map[account.customerId] ?? map[account.company] ?? map[account.company.toLowerCase()];
}

function cleanOvernight(value: unknown, facts: DashboardCopyFacts): string[] {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  const money = allowedMoney(facts);
  const numbers = numbersInFacts(facts);
  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => {
      const text = item.replace(/\s+/g, ' ').trim();
      return /[.!?]$/.test(text) ? text : `${text}.`;
    })
    .filter((item) => {
      if (item.length < 20 || item.length > 180) return false;
      if (/@|https?:/i.test(item)) return false;
      if (hasUnknownMoney(item, money)) return false;
      return !hasUnknownNumber(item, numbers);
    })
    .slice(0, 4);
}

function readModelCopy(value: unknown, facts: DashboardCopyFacts): DashboardCopy | null {
  const row = asRecord(value);
  if (!row) return null;
  const byId = accountsById(facts);
  const money = allowedMoney(facts);
  const numbers = numbersInFacts(facts);
  const beats: Record<string, string> = {};
  const summaries: Record<string, string> = {};
  const activity: Record<string, string> = {};
  const promiseNotes: Record<string, string> = {};
  const actions: Record<string, [string, string]> = {};
  const beatRow = textMap(row.beats ?? row.digest);
  const summaryRow = textMap(row.summaries ?? row.cards);
  const activityRow = textMap(row.activity ?? row.queue);
  const promiseRow = textMap(row.promiseNotes ?? row.promises);
  const actionRow = asRecord(row.actions) ?? {};

  for (const [customerId, account] of byId) {
    const beat = cleanClause(textFor(beatRow, account), account);
    if (beat && !hasUnknownMoney(beat, money) && !hasUnknownNumber(beat, numbers)) {
      beats[customerId] = beat;
    }
    const summary = cleanSentence(textFor(summaryRow, account), 320, numbers);
    if (summary && !hasUnknownMoney(summary, money)) summaries[customerId] = summary;
    const line = cleanSentence(textFor(activityRow, account), 180, numbers);
    if (line && !hasUnknownMoney(line, money)) activity[customerId] = line;
    const note = cleanPromiseNote(textFor(promiseRow, account), account);
    if (note) promiseNotes[customerId] = note;
    const pair = cleanActionPair(
      actionRow[customerId] ??
        actionRow[account.company] ??
        actionRow[account.company.toLowerCase()],
      numbers
    );
    if (pair) actions[customerId] = pair;
  }

  const copy: DashboardCopy = {
    beats,
    summaries,
    activity,
    promiseNotes,
    actions,
    overnight: cleanOvernight(row.overnight ?? row.bullets, facts)
  };
  if (
    Object.keys(copy.beats).length === 0 &&
    Object.keys(copy.summaries).length === 0 &&
    Object.keys(copy.activity).length === 0 &&
    Object.keys(copy.promiseNotes).length === 0 &&
    Object.keys(copy.actions).length === 0 &&
    copy.overnight.length === 0
  ) {
    return null;
  }
  return copy;
}

function parseModelJson(text: string): unknown {
  const fenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  return JSON.parse(fenced);
}

export async function summarizeDashboard(payload: unknown): Promise<DashboardCopy | null> {
  const facts = readDashboardCopyFacts(payload);
  if (!facts || !isGeminiConfigured()) return null;

  const key = createHash('sha256')
    .update(`v4:${JSON.stringify(facts)}`)
    .digest('hex');
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.copy;

  const prompt = `Facts:\n${JSON.stringify(facts)}\nWrite the dashboard JSON from these facts only.`;
  const models = [geminiModelId()];
  if (!models.includes('gemini-3.5-flash')) models.push('gemini-3.5-flash');

  for (const model of models) {
    try {
      const { text } = await generateGeminiText({
        system: SYSTEM,
        prompt,
        temperature: 0.4,
        json: true,
        model,
        timeoutMs: 45_000
      });
      const copy = readModelCopy(parseModelJson(text), facts);
      if (!copy) {
        console.error('[dashboard] summary rejected');
        continue;
      }
      cache.set(key, { at: Date.now(), copy });
      if (cache.size > 40) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      return copy;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      console.error('[dashboard] summary failed', message);
    }
  }
  return null;
}
