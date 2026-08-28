import type { Invoice } from '@/features/revcollect/types';
import { calendarDaysBetween } from '@/features/revcollect/utils';
import { isPaidCanonicalInvoice } from '@/features/revcollect/lib/invoice-open';
import { emptyIntelligence } from './defaults';
import { getCanonicalStore } from './store';
import type {
  CanonicalPayment,
  CanonicalSnapshot,
  CustomerIntelligence,
  PatternTrend
} from './types';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trendFromDays(days: number[]): PatternTrend {
  if (days.length < 2) return 'stable';
  const midpoint = Math.floor(days.length / 2);
  const older = mean(days.slice(0, midpoint));
  const newer = mean(days.slice(midpoint));
  const delta = newer - older;
  if (delta <= -5) return 'improving';
  if (delta >= 5) return 'worsening';
  return 'stable';
}

function lastPaymentAt(invoice: Invoice, payments: CanonicalPayment[]): string | undefined {
  if (invoice.paidAt) return invoice.paidAt.slice(0, 10);
  const related = payments
    .filter((payment) => payment.invoiceId === invoice.id)
    .toSorted((left, right) => left.paidAt.localeCompare(right.paidAt));
  return related.at(-1)?.paidAt.slice(0, 10);
}

export function recomputePatternsForSnapshot(snapshot: CanonicalSnapshot): CanonicalSnapshot {
  const intelligenceByCustomerId = { ...snapshot.intelligenceByCustomerId };

  for (const customer of snapshot.customers) {
    const invoices = snapshot.invoices.filter((invoice) => invoice.customerId === customer.id);
    const paid = invoices.filter(isPaidCanonicalInvoice);
    const settled = paid
      .map((invoice) => {
        const paidAt = lastPaymentAt(invoice, snapshot.payments);
        const issueDate = (invoice.issueDate ?? invoice.dueDate).slice(0, 10);
        if (!paidAt) return null;
        return {
          invoice,
          paidAt,
          dso: Math.max(0, calendarDaysBetween(issueDate, paidAt)),
          daysVsDue: calendarDaysBetween(invoice.dueDate, paidAt)
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .toSorted((left, right) => left.paidAt.localeCompare(right.paidAt));

    const dsoDays = settled.map((row) => row.dso);
    const onTimeCount = settled.filter((row) => row.daysVsDue <= 0).length;
    const current = intelligenceByCustomerId[customer.id] ?? emptyIntelligence();
    const patterns = {
      ...current.patterns,
      avgDso: Math.round(mean(dsoDays)),
      onTimeRate: settled.length === 0 ? 0 : Math.round((onTimeCount / settled.length) * 100),
      trend: trendFromDays(dsoDays)
    };
    const intelligence: CustomerIntelligence = {
      ...current,
      patterns,
      relationshipState: current.relationshipState ?? 'normal'
    };
    intelligenceByCustomerId[customer.id] = intelligence;
    customer.relationshipState = intelligence.relationshipState;
  }

  return { ...snapshot, intelligenceByCustomerId };
}

export async function recomputeCustomerPatterns(tenantId: string): Promise<CanonicalSnapshot> {
  const store = await getCanonicalStore();
  const snapshot = recomputePatternsForSnapshot(await store.read(tenantId));
  await store.write(tenantId, snapshot);
  return snapshot;
}
