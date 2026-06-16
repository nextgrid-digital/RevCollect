import { StatusBadge, type StatusBadgeTone } from '../../components/status-badge';
import type { CustomerRiskTier } from '../lib/classify-customer-risk-tier';

const riskConfig: Record<CustomerRiskTier, { label: string; tone: StatusBadgeTone }> = {
  healthy: { label: 'Healthy', tone: 'success' },
  watch: { label: 'Watch', tone: 'warning' },
  high: { label: 'High', tone: 'danger' }
};

export function CustomerRiskBadge({ tier }: { tier: CustomerRiskTier }) {
  const config = riskConfig[tier];
  return <StatusBadge label={config.label} tone={config.tone} rounded='full' />;
}
