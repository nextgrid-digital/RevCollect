import type { AgentDigestPreview, AgentRiskThresholds } from '../../types';
import { SettingsSection } from '../../settings/components/settings-section';

function formatDigestHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

interface AgentDigestPreviewSectionProps {
  digest: AgentDigestPreview;
  digestHour: number;
  riskThresholds: AgentRiskThresholds;
}

export function AgentDigestPreviewSection({
  digest,
  digestHour,
  riskThresholds
}: AgentDigestPreviewSectionProps) {
  const dynamicBullets = [
    `Invoices ${riskThresholds.criticalDaysMin}+ days overdue appear here`,
    ...digest.bullets.slice(1)
  ];

  return (
    <SettingsSection
      title='Daily summary email'
      description='Example of the digest when daily digest is on.'
    >
      <div className='bg-muted/40 rounded-lg px-4 py-3'>
        <p className='text-sm font-medium'>
          Daily digest at {formatDigestHour(digestHour)} for {digest.dateLabel}
        </p>
        <ul className='text-muted-foreground mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed'>
          {dynamicBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </SettingsSection>
  );
}
