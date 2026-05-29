import type { Customer, ThreadEmail, TimelineEvent } from '../../types';

/** 1-based turn index in the thread `turns` array (maps to msg-N-turn-M). */
export const TIMELINE_EMAIL_TURN_BY_EVENT_ID: Record<string, number> = {
  'tl-1': 4,
  'tl-2': 1,
  'tl-4': 2,
  'tl-7': 4,
  'tl-7b': 3,
  'tl-7c': 2,
  'tl-7d': 1,
  'tl-9': 2,
  'tl-11': 2,
  'tl-13': 4,
  'tl-15': 4,
  'tl-18': 3,
  'tl-19': 4,
  'tl-20': 1,
  'tl-21': 2,
  'tl-23': 2
};

function threadIdForCustomer(customerId: string, customers: Customer[]): string | undefined {
  const index = customers.findIndex((customer) => customer.id === customerId);
  if (index < 0) return undefined;
  return `msg-${index + 1}`;
}

function cloneTimeline(raw: Record<string, TimelineEvent[]>): Record<string, TimelineEvent[]> {
  const result: Record<string, TimelineEvent[]> = {};
  for (const [customerId, events] of Object.entries(raw)) {
    result[customerId] = events.map((event) => ({ ...event }));
  }
  return result;
}

export function enrichTimelineWithThreads(
  rawTimelineByCustomerId: Record<string, TimelineEvent[]>,
  threadEmailsByThreadId: Record<string, ThreadEmail[]>,
  customers: Customer[]
): Record<string, TimelineEvent[]> {
  const enriched = cloneTimeline(rawTimelineByCustomerId);

  for (const events of Object.values(enriched)) {
    for (const event of events) {
      const turn = TIMELINE_EMAIL_TURN_BY_EVENT_ID[event.id];
      if (turn === undefined) continue;

      const threadId = threadIdForCustomer(event.customerId, customers);
      if (!threadId) continue;

      const emails = threadEmailsByThreadId[threadId];
      if (!emails?.length) continue;

      const email = emails.find((item) => item.id === `${threadId}-turn-${turn}`);
      if (!email) continue;

      event.threadEmailId = email.id;
      event.occurredAt = email.sentAt;
    }
  }

  return enriched;
}
