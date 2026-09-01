import { formatCurrencyWhole, getDaysOverdueFromDueDate } from '@/features/revcollect/utils';
import {
  invoiceAmountDueCents,
  isOpenCanonicalInvoice,
  isPaidCanonicalInvoice
} from '@/features/revcollect/lib/invoice-open';
import { emptyIntelligence } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { CustomerIntelligence } from '@/lib/canonical/types';
import type { DraftFacts } from '@/lib/ai/validators';
import { extractDraftFacts } from '@/lib/ai/validators';

const FACT_GUARD = 'Use ONLY the data provided. Do not invent numbers, amounts, dates, or names.';

export interface AssembledContext {
  customerId: string;
  customerName: string;
  promptBlock: string;
  facts: DraftFacts;
  intelligence: CustomerIntelligence;
  relationshipState: CustomerIntelligence['relationshipState'];
}

function formatAmount(cents: number): string {
  return formatCurrencyWhole(cents).replace('$', '').replaceAll(',', '');
}

export async function assembleCustomerContext(
  tenantId: string,
  customerId: string
): Promise<AssembledContext | null> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const customer = snapshot.customers.find((item) => item.id === customerId);
  if (!customer) return null;

  const invoices = snapshot.invoices.filter((invoice) => invoice.customerId === customerId);
  const openInvoices = invoices.filter(isOpenCanonicalInvoice);
  const paidInvoices = invoices.filter(isPaidCanonicalInvoice);
  const recentPayments = snapshot.payments
    .filter((payment) => payment.customerId === customerId)
    .toSorted((left, right) => right.paidAt.localeCompare(left.paidAt))
    .slice(0, 8);
  const intelligence = snapshot.intelligenceByCustomerId[customerId] ?? emptyIntelligence();
  const activeSituations = intelligence.situations.filter(
    (situation) => situation.status === 'active'
  );

  const invoiceLines = openInvoices
    .map((invoice) => {
      const days = getDaysOverdueFromDueDate(invoice.dueDate);
      const dueLabel = days > 0 ? `${days} days overdue` : 'not overdue';
      return `- ${invoice.number}: ${formatCurrencyWhole(invoiceAmountDueCents(invoice))} due ${invoice.dueDate} (${dueLabel})`;
    })
    .join('\n');

  const paymentLines =
    recentPayments.length === 0 && paidInvoices.length === 0
      ? '- none'
      : [
          ...recentPayments.map((payment) => {
            const invoice = invoices.find((item) => item.id === payment.invoiceId);
            const invoiceLabel = invoice ? ` for ${invoice.number}` : '';
            return `- ${formatCurrencyWhole(payment.amountCents)} on ${payment.paidAt.slice(0, 10)}${invoiceLabel}`;
          }),
          ...paidInvoices.slice(0, 5).map((invoice) => {
            const paidOn = invoice.paidAt ?? 'unknown date';
            return `- ${invoice.number} paid ${formatCurrencyWhole(invoice.paidCents ?? invoice.amountCents)} on ${paidOn}`;
          })
        ]
          .slice(0, 8)
          .join('\n');

  const situationLines =
    activeSituations.length === 0
      ? '- none'
      : activeSituations
          .map(
            (situation) =>
              `- ${situation.flag}: ${situation.detail ?? situation.evidence} (expires ${situation.expires.slice(0, 10)})`
          )
          .join('\n');

  const promptBlock = [
    FACT_GUARD,
    '',
    '## Type 1 Facts (live, never invent)',
    `Customer: ${customer.name} (${customer.company})`,
    `Email: ${customer.email}`,
    `Open balance: ${formatCurrencyWhole(customer.balanceCents)}`,
    `Oldest days overdue: ${customer.daysOverdue}`,
    'Open invoices:',
    invoiceLines || '- none',
    'Recent payments:',
    paymentLines,
    '',
    '## Type 2 Patterns (SQL, no AI)',
    `Average DSO: ${intelligence.patterns.avgDso} days`,
    `On-time rate: ${intelligence.patterns.onTimeRate}%`,
    `Trend: ${intelligence.patterns.trend}`,
    '',
    '## Type 3 Situations (expiring)',
    situationLines,
    '',
    '## Type 4 Preferences',
    `Greeting: ${intelligence.preferences.greeting ?? 'default'}`,
    `Signoff: ${intelligence.preferences.signoff ?? 'default'}`,
    `Never mention: ${(intelligence.preferences.neverMention ?? []).join(', ') || 'none'}`,
    '',
    `Relationship state: ${intelligence.relationshipState}`,
    intelligence.relationshipPolicy?.pendingSuggestion
      ? `Pending relationship suggestion: ${intelligence.relationshipPolicy.pendingSuggestion.reason} — "${intelligence.relationshipPolicy.pendingSuggestion.quote}"`
      : 'Pending relationship suggestion: none'
  ].join('\n');

  const facts: DraftFacts = {
    invoiceNumbers: openInvoices.map((invoice) => invoice.number),
    amounts: [
      formatAmount(customer.balanceCents),
      ...openInvoices.map((invoice) => formatAmount(invoiceAmountDueCents(invoice)))
    ],
    dates: openInvoices.flatMap(
      (invoice) => [invoice.dueDate, invoice.issueDate].filter(Boolean) as string[]
    )
  };

  return {
    customerId,
    customerName: customer.name,
    promptBlock,
    facts: {
      invoiceNumbers: extractDraftFacts(facts.invoiceNumbers.join(' ')).invoiceNumbers.concat(
        facts.invoiceNumbers
      ),
      amounts: facts.amounts,
      dates: facts.dates
    },
    intelligence,
    relationshipState: intelligence.relationshipState
  };
}
