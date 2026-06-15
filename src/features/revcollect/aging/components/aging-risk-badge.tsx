import type { AgingRiskLevel } from '../../types';
import { StatusBadge, type StatusBadgeTone } from '../../components/status-badge';

const riskConfig: Record<AgingRiskLevel, { label: string; tone: StatusBadgeTone }> = {
  low: { label: 'Low', tone: 'success' },
  medium: { label: 'Medium', tone: 'warning' },
  high: { label: 'High', tone: 'danger' }
};

export function AgingRiskBadge({ risk }: { risk: AgingRiskLevel }) {
  const config = riskConfig[risk];
  return <StatusBadge label={config.label} tone={config.tone} rounded='full' />;
}
