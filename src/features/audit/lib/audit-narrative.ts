import { z } from 'zod';
import type { AuditReport } from './types';
import {
  buildAgingNinetyCallout,
  buildCoverClosing,
  buildCoverTeaser,
  buildCreditDonorsCopy,
  buildFixReleaseCopy,
  buildInterestCopy,
  buildInterestHeadline,
  buildModelPayersCopy,
  buildOneToWatchCopy,
  buildPage1Intro,
  buildPriorityIntro,
  buildTermsGapCopy,
  buildWhyOrderCopy,
  formatMoney
} from './report-copy';

export const auditNarrativeSchema = z.object({
  page1Intro: z.string().min(1),
  coverClosing: z.string().min(1),
  coverTeaser: z.string().min(1),
  termsGapCopy: z.string().min(1),
  agingNinetyCallout: z.string().min(1),
  interestHeadline: z.string().min(1),
  interestCopy: z.string().min(1),
  priorityIntro: z.string().min(1),
  whyOrderCopy: z.string().min(1),
  modelPayersCopy: z.string().min(1),
  creditDonorsCopy: z.string().min(1),
  oneToWatchCopy: z.string().min(1),
  fixReleaseCopy: z.string().min(1)
});

export type AuditNarrative = z.infer<typeof auditNarrativeSchema>;

/** Compact facts for the model — numbers stay authoritative; AI only writes prose. */
export function buildAuditFacts(report: AuditReport) {
  const watch = report.customers.find((c) => c.customer === report.oneToWatch);
  const donors = report.customers.filter((c) => report.creditDonors.includes(c.customer));

  return {
    companyName: report.companyName,
    analysisDate: report.analysisDate.toISOString().slice(0, 10),
    headline: {
      invoiceCount: report.headline.invoiceCount,
      paidCount: report.headline.paidCount,
      outstandingCount: report.headline.outstandingCount,
      monthSpan: report.headline.monthSpan,
      openAr: Math.round(report.headline.openAr),
      openCustomerCount: report.headline.openCustomerCount,
      averageMonthlyBilling: Math.round(report.headline.averageMonthlyBilling),
      vwAvgDaysToPay: Number(report.headline.vwAvgDaysToPay.toFixed(1)),
      vwAvgTerms: Number(report.headline.vwAvgTerms.toFixed(1)),
      extraCreditDays: Number(report.headline.extraCreditDays.toFixed(1)),
      cashLocked: Math.round(report.headline.cashLocked),
      interestCostAnnual: Math.round(report.headline.interestCostAnnual),
      aging: {
        Current: Math.round(report.headline.aging.Current),
        '1-30': Math.round(report.headline.aging['1-30']),
        '31-60': Math.round(report.headline.aging['31-60']),
        '61-90': Math.round(report.headline.aging['61-90']),
        '90+': Math.round(report.headline.aging['90+'])
      },
      withinTermsCount: report.headline.withinTermsCount
    },
    modelPayers: report.modelPayers,
    creditDonors: donors.map((c) => ({
      customer: c.customer,
      avgDaysLate: c.avgDaysLate == null ? null : Math.round(c.avgDaysLate)
    })),
    oneToWatch: watch
      ? {
          customer: watch.customer,
          lateTrendDays: watch.lateTrendDays == null ? null : Math.round(watch.lateTrendDays),
          behaviorRead: watch.behaviorRead
        }
      : null,
    priority: report.priority.map((p) => ({
      rank: p.rank,
      customer: p.customer,
      openValue: Math.round(p.openValue),
      valueWeightedAge: Math.round(p.valueWeightedAge),
      avgDaysLate: p.avgDaysLate == null ? null : Math.round(p.avgDaysLate),
      recommendedFirstMove: p.recommendedFirstMove
    })),
    fixReleaseLow: Math.round(report.fixReleaseLow),
    fixReleaseHigh: Math.round(report.fixReleaseHigh),
    moneyLabels: {
      openAr: formatMoney(report.headline.openAr),
      cashLocked: formatMoney(report.headline.cashLocked),
      interestCostAnnual: formatMoney(report.headline.interestCostAnnual),
      averageMonthlyBilling: formatMoney(report.headline.averageMonthlyBilling),
      aging90: formatMoney(report.headline.aging['90+']),
      fixReleaseLow: formatMoney(report.fixReleaseLow),
      fixReleaseHigh: formatMoney(report.fixReleaseHigh)
    }
  };
}

export function buildFallbackNarrative(report: AuditReport): AuditNarrative {
  return {
    page1Intro: buildPage1Intro(report),
    coverClosing: buildCoverClosing(report),
    coverTeaser: buildCoverTeaser(),
    termsGapCopy: buildTermsGapCopy(report),
    agingNinetyCallout: buildAgingNinetyCallout(report),
    interestHeadline: buildInterestHeadline(report),
    interestCopy: buildInterestCopy(report),
    priorityIntro: buildPriorityIntro(report),
    whyOrderCopy: buildWhyOrderCopy(report),
    modelPayersCopy: buildModelPayersCopy(report),
    creditDonorsCopy: buildCreditDonorsCopy(report),
    oneToWatchCopy: buildOneToWatchCopy(report),
    fixReleaseCopy: buildFixReleaseCopy(report)
  };
}
