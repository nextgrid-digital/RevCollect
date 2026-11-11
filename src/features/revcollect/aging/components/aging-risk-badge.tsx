import type { AgingRiskLevel } from '../../types';
import { StatusBadge, type StatusBadgeTone } from '../../components/status-badge';

/** Labels aligned with Customers list (Healthy / Watch / High). */
const riskConfig: Record<AgingRiskLevel, { label: string; tone: StatusBadgeTone }> = {
  low: { label: 'Healthy', tone: 'success' },
  medium: { label: 'Watch', tone: 'warning' },
  high: { label: 'High', tone: 'danger' }
};

export function AgingRiskBadge({ risk }: { risk: AgingRiskLevel }) {
  const config = riskConfig[risk];
  return <StatusBadge label={config.label} tone={config.tone} rounded='full' />;
}
