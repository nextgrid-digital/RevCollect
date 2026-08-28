import { emptyIntelligence } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { CustomerPreferences } from '@/lib/canonical/types';

const GREETING_PATTERN = /^(hi|hello|dear)\s+[^,\n]+/i;
const SIGNOFF_PATTERN = /^(thanks|thank you|best regards|kind regards|regards|cheers)[^\n]*$/im;

export function preferencesFromDraftDiff(
  originalBody: string,
  sentBody: string
): CustomerPreferences {
  const preferences: CustomerPreferences = {};
  if (originalBody.trim() === sentBody.trim()) return preferences;

  const sentGreeting = sentBody.match(GREETING_PATTERN)?.[0]?.trim();
  const originalGreeting = originalBody.match(GREETING_PATTERN)?.[0]?.trim();
  if (sentGreeting && sentGreeting !== originalGreeting) {
    preferences.greeting = sentGreeting;
  }

  const sentSignoff = sentBody.match(SIGNOFF_PATTERN)?.[0]?.trim();
  const originalSignoff = originalBody.match(SIGNOFF_PATTERN)?.[0]?.trim();
  if (sentSignoff && sentSignoff !== originalSignoff) {
    preferences.signoff = sentSignoff;
  }

  return preferences;
}

export async function applyPreferencesFromEdit(
  tenantId: string,
  customerId: string,
  originalBody: string,
  sentBody: string
): Promise<CustomerPreferences> {
  const extracted = preferencesFromDraftDiff(originalBody, sentBody);
  if (!extracted.greeting && !extracted.signoff) return extracted;

  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const current = snapshot.intelligenceByCustomerId[customerId] ?? emptyIntelligence();
  const nextPreferences: CustomerPreferences = {
    ...current.preferences,
    ...extracted
  };
  snapshot.intelligenceByCustomerId[customerId] = {
    ...current,
    preferences: nextPreferences
  };
  await store.write(tenantId, snapshot);
  return nextPreferences;
}
