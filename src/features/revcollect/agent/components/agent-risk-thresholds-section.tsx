'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { AgentRiskThresholds } from '../../types';
import { SettingsSection } from '../../settings/components/settings-section';
import { cn } from '@/lib/utils';
import {
  getRiskThresholdSliderBounds,
  setCriticalMin,
  setHealthyEnd,
  setUrgentRange,
  setWatchRange
} from '../lib/risk-thresholds';

const THRESHOLD_ROWS: {
  key: 'healthy' | 'watch' | 'urgent' | 'critical';
  label: string;
  hint: string;
  dotClass: string;
  format: (thresholds: AgentRiskThresholds) => string;
}[] = [
  {
    key: 'healthy',
    label: 'Just overdue',
    hint: 'Polite first reminder',
    dotClass: 'bg-emerald-500',
    format: (t) => `${t.healthyDays[0]} – ${t.healthyDays[1]} days overdue`
  },
  {
    key: 'watch',
    label: 'Follow up',
    hint: 'Second reminder',
    dotClass: 'bg-amber-500',
    format: (t) => `${t.watchDays[0]} – ${t.watchDays[1]} days overdue`
  },
  {
    key: 'urgent',
    label: 'Chase again',
    hint: 'Firms up the request',
    dotClass: 'bg-orange-500',
    format: (t) => `${t.urgentDays[0]} – ${t.urgentDays[1]} days overdue`
  },
  {
    key: 'critical',
    label: 'Flag for you',
    hint: 'Stop drafting and ask you',
    dotClass: 'bg-red-500',
    format: (t) => `${t.criticalDaysMin}+ days overdue`
  }
];

interface AgentRiskThresholdsSectionProps {
  thresholds: AgentRiskThresholds;
  onChange: (thresholds: AgentRiskThresholds) => void;
}

export function AgentRiskThresholdsSection({
  thresholds,
  onChange
}: AgentRiskThresholdsSectionProps) {
  const bounds = getRiskThresholdSliderBounds(thresholds);

  return (
    <SettingsSection
      title='When to start chasing (days overdue)'
      description='These are days past due, same idea as Xero aging.'
    >
      <ul className='space-y-6'>
        {THRESHOLD_ROWS.map((row) => {
          const sliderId = `agent-threshold-${row.key}`;
          return (
            <li key={row.key} className='space-y-3'>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2'>
                  <span className={cn('size-2 shrink-0 rounded-full', row.dotClass)} aria-hidden />
                  <div className='min-w-0'>
                    <Label htmlFor={sliderId} className='text-sm font-medium'>
                      {row.label}
                    </Label>
                    <p className='text-muted-foreground text-xs'>{row.hint}</p>
                  </div>
                </div>
                <span className='text-muted-foreground shrink-0 text-sm tabular-nums'>
                  {row.format(thresholds)}
                </span>
              </div>
              {row.key === 'healthy' ? (
                <Slider
                  id={sliderId}
                  min={bounds.healthy.min}
                  max={bounds.healthy.max}
                  step={1}
                  value={[thresholds.healthyDays[1]]}
                  onValueChange={([value]) => onChange(setHealthyEnd(thresholds, value))}
                  aria-label={`${row.label} maximum days overdue`}
                />
              ) : null}
              {row.key === 'watch' ? (
                <Slider
                  id={sliderId}
                  min={bounds.watch.min}
                  max={bounds.watch.max}
                  step={1}
                  value={[thresholds.watchDays[1]]}
                  onValueChange={([value]) => onChange(setWatchRange(thresholds, value))}
                  aria-label={`${row.label} maximum days overdue`}
                />
              ) : null}
              {row.key === 'urgent' ? (
                <Slider
                  id={sliderId}
                  min={bounds.urgent.min}
                  max={bounds.urgent.max}
                  step={1}
                  value={[thresholds.urgentDays[1]]}
                  onValueChange={([value]) => onChange(setUrgentRange(thresholds, value))}
                  aria-label={`${row.label} maximum days overdue`}
                />
              ) : null}
              {row.key === 'critical' ? (
                <Slider
                  id={sliderId}
                  min={bounds.critical.min}
                  max={bounds.critical.max}
                  step={1}
                  value={[thresholds.criticalDaysMin]}
                  onValueChange={([value]) => onChange(setCriticalMin(thresholds, value))}
                  aria-label={`${row.label} minimum days overdue`}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className='text-muted-foreground text-xs'>
        Drag to set when a reminder gets firmer. Flag for you stops drafting and asks you instead.
      </p>
    </SettingsSection>
  );
}
