export { parseInvoicesCsv, parseTermsDays } from './parse-invoices';
export { computeAuditReport, enrichInvoices, classifyBehavior } from './compute-audit';
export {
  buildBehaviorRead,
  buildFirstMove,
  formatMoney,
  formatDays,
  formatTrend
} from './narrative';
export {
  buildBenchmarkRows,
  gapVsHealthyGuidance,
  COST_OF_FUNDS_RATE,
  BEHAVIOR_BAND_THRESHOLDS
} from './benchmarks';
export type * from './types';
