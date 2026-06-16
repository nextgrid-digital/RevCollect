export const INBOX_INSIGHTS_DETAILS_STORAGE_KEY = 'revcollect-inbox-insights-details-expanded';

export function readInboxInsightsDetailsExpanded(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(INBOX_INSIGHTS_DETAILS_STORAGE_KEY);
  if (stored === null) return true;
  return stored === 'true';
}

export function writeInboxInsightsDetailsExpanded(expanded: boolean): void {
  localStorage.setItem(INBOX_INSIGHTS_DETAILS_STORAGE_KEY, expanded ? 'true' : 'false');
}
