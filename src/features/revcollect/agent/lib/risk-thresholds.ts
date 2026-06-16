import type { AgentRiskThresholds } from '../../types';

export const RISK_THRESHOLD_MAX_DAYS = 120;
const MIN_BAND_SPAN = 1;

export function normalizeRiskThresholds(thresholds: AgentRiskThresholds): AgentRiskThresholds {
  let healthyEnd = clamp(thresholds.healthyDays[1], 0, RISK_THRESHOLD_MAX_DAYS - 3);
  let watchStart = healthyEnd + 1;
  let watchEnd = clamp(
    Math.max(thresholds.watchDays[1], watchStart + MIN_BAND_SPAN - 1),
    watchStart,
    RISK_THRESHOLD_MAX_DAYS - 2
  );
  let urgentStart = watchEnd + 1;
  let urgentEnd = clamp(
    Math.max(thresholds.urgentDays[1], urgentStart + MIN_BAND_SPAN - 1),
    urgentStart,
    RISK_THRESHOLD_MAX_DAYS - 1
  );
  let criticalMin = clamp(
    Math.max(thresholds.criticalDaysMin, urgentEnd),
    urgentEnd,
    RISK_THRESHOLD_MAX_DAYS
  );

  return {
    healthyDays: [0, healthyEnd],
    watchDays: [watchStart, watchEnd],
    urgentDays: [urgentStart, urgentEnd],
    criticalDaysMin: criticalMin
  };
}

export function setHealthyEnd(
  thresholds: AgentRiskThresholds,
  healthyEnd: number
): AgentRiskThresholds {
  const nextHealthyEnd = clamp(healthyEnd, 0, thresholds.watchDays[1] - MIN_BAND_SPAN);
  return normalizeRiskThresholds({
    ...thresholds,
    healthyDays: [0, nextHealthyEnd]
  });
}

export function setWatchRange(
  thresholds: AgentRiskThresholds,
  watchEnd: number
): AgentRiskThresholds {
  const watchStart = thresholds.healthyDays[1] + 1;
  const nextWatchEnd = clamp(watchEnd, watchStart, thresholds.urgentDays[1] - MIN_BAND_SPAN);
  return normalizeRiskThresholds({
    ...thresholds,
    watchDays: [watchStart, nextWatchEnd]
  });
}

export function setUrgentRange(
  thresholds: AgentRiskThresholds,
  urgentEnd: number
): AgentRiskThresholds {
  const urgentStart = thresholds.watchDays[1] + 1;
  const nextUrgentEnd = clamp(
    urgentEnd,
    urgentStart,
    Math.max(thresholds.criticalDaysMin, RISK_THRESHOLD_MAX_DAYS - 1)
  );
  return normalizeRiskThresholds({
    ...thresholds,
    urgentDays: [urgentStart, nextUrgentEnd],
    criticalDaysMin: Math.max(thresholds.criticalDaysMin, urgentEnd)
  });
}

export function setCriticalMin(
  thresholds: AgentRiskThresholds,
  criticalMin: number
): AgentRiskThresholds {
  return normalizeRiskThresholds({
    ...thresholds,
    criticalDaysMin: criticalMin
  });
}

export function getRiskThresholdSliderBounds(thresholds: AgentRiskThresholds) {
  const healthyMin = 0;
  const healthyMax = Math.max(thresholds.watchDays[1] - MIN_BAND_SPAN, healthyMin);

  const watchMin = thresholds.healthyDays[1] + 1;
  const watchMax = Math.max(thresholds.urgentDays[1] - MIN_BAND_SPAN, watchMin);

  const urgentMin = thresholds.watchDays[1] + 1;
  const urgentMax = Math.max(RISK_THRESHOLD_MAX_DAYS - 1, urgentMin);

  const criticalMin = thresholds.urgentDays[1];
  const criticalMax = RISK_THRESHOLD_MAX_DAYS;

  return {
    healthy: { min: healthyMin, max: healthyMax },
    watch: { min: watchMin, max: watchMax },
    urgent: { min: urgentMin, max: urgentMax },
    critical: { min: criticalMin, max: criticalMax }
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
