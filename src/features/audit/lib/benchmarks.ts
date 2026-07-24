import type { AuditReport } from './types';
import { formatDays, formatMoney } from './narrative';

/** Matches interest assumption in compute-audit.ts */
export const COST_OF_FUNDS_RATE = 0.12;

export const BEHAVIOR_BAND_THRESHOLDS = {
  reliableMaxLateDays: 5,
  mildlySlowMaxLateDays: 15,
  chronicallySlowMaxLateDays: 30,
  deterioratingMinTrendDays: 8
} as const;

/** Guidance only; not computed peers */
export const HEALTHY_GAP_GUIDANCE_DAYS = { min: 5, max: 10 } as const;
export const STRUCTURAL_GAP_GUIDANCE_DAYS = { min: 15, max: 20 } as const;

export interface BenchmarkRow {
  id: string;
  label: string;
  value: string;
  detail: string;
  kind: 'metric' | 'assumption' | 'guidance';
}

export function buildBenchmarkRows(report: AuditReport): BenchmarkRow[] {
  const { headline } = report;
  const stated = Math.round(headline.vwAvgTerms);
  const actual = Math.round(headline.vwAvgDaysToPay * 10) / 10;
  const gap = Math.round(headline.extraCreditDays * 10) / 10;
  const over90Share = headline.openAr > 0 ? (headline.aging['90+'] / headline.openAr) * 100 : 0;

  return [
    {
      id: 'terms',
      label: 'Contractual terms (benchmark)',
      value: `${stated} days`,
      detail:
        'Value-weighted Net terms from your invoice Terms column: the promise you made on paper.',
      kind: 'metric'
    },
    {
      id: 'actual',
      label: 'Actual collection',
      value: formatDays(headline.vwAvgDaysToPay, 1),
      detail: 'Value-weighted days from issue to payment on settled invoices (Paid*).',
      kind: 'metric'
    },
    {
      id: 'gap',
      label: 'Extra credit days',
      value: `${gap} days`,
      detail: `Actual minus terms. Parks ${formatMoney(headline.cashLocked)} of cash with customers.`,
      kind: 'metric'
    },
    {
      id: 'ninety',
      label: '90+ concentration',
      value: `${over90Share.toFixed(1)}% of open AR`,
      detail: `${formatMoney(headline.aging['90+'])} is more than 90 days past due. Recovery odds fall sharply here.`,
      kind: 'metric'
    },
    {
      id: 'cof',
      label: 'Cost-of-funds assumption',
      value: `${(COST_OF_FUNDS_RATE * 100).toFixed(0)}% / year`,
      detail: `Interest framing on cash locked ≈ ${formatMoney(headline.interestCostAnnual)}/yr. Substitute your actual rate.`,
      kind: 'assumption'
    },
    {
      id: 'peer',
      label: 'Healthy SMB guidance',
      value: `Within ~${HEALTHY_GAP_GUIDANCE_DAYS.min}-${HEALTHY_GAP_GUIDANCE_DAYS.max}d of terms`,
      detail: `A ${STRUCTURAL_GAP_GUIDANCE_DAYS.min}-${STRUCTURAL_GAP_GUIDANCE_DAYS.max} day structural gap is a working-capital problem, not a reporting quirk. Guidance only; not peer data.`,
      kind: 'guidance'
    }
  ];
}

export function gapVsHealthyGuidance(extraCreditDays: number): {
  status: 'healthy' | 'watch' | 'structural';
  label: string;
} {
  if (extraCreditDays <= HEALTHY_GAP_GUIDANCE_DAYS.max) {
    return { status: 'healthy', label: 'Within healthy guidance band' };
  }
  if (extraCreditDays < STRUCTURAL_GAP_GUIDANCE_DAYS.min) {
    return { status: 'watch', label: 'Above healthy band; watch closely' };
  }
  return { status: 'structural', label: 'Structural gap: working capital at risk' };
}
