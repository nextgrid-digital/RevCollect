import type { AgentRiskThresholds } from '../../types';

export type CustomerRiskTier = 'healthy' | 'watch' | 'high';

export type CustomerRiskFilter = 'all' | CustomerRiskTier;

export function classifyCustomerRiskTier(
  daysOverdue: number,
  thresholds: AgentRiskThresholds
): CustomerRiskTier {
  if (daysOverdue <= thresholds.healthyDays[1]) {
    return 'healthy';
  }

  if (daysOverdue <= thresholds.watchDays[1]) {
    return 'watch';
  }

  return 'high';
}
