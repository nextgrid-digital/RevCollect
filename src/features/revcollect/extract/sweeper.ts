import { emptyIntelligence } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { CanonicalSnapshot } from '@/lib/canonical/types';

export function retireExpiredSituations(
  snapshot: CanonicalSnapshot,
  now = new Date()
): CanonicalSnapshot {
  const nowMs = now.getTime();
  const intelligenceByCustomerId = { ...snapshot.intelligenceByCustomerId };

  for (const [customerId, intelligence] of Object.entries(intelligenceByCustomerId)) {
    const current = intelligence ?? emptyIntelligence();
    const situations = current.situations.map((situation) => {
      if (situation.status !== 'active') return situation;
      const expiresMs = Date.parse(situation.expires);
      if (Number.isNaN(expiresMs) || expiresMs > nowMs) return situation;
      return {
        ...situation,
        status: 'retired' as const,
        retireOn: now.toISOString()
      };
    });
    intelligenceByCustomerId[customerId] = { ...current, situations };
  }

  return { ...snapshot, intelligenceByCustomerId };
}

export async function sweepExpiredSituations(tenantId: string): Promise<void> {
  const store = await getCanonicalStore();
  const next = retireExpiredSituations(await store.read(tenantId));
  await store.write(tenantId, next);
}
