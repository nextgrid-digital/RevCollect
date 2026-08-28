import { randomUUID } from 'crypto';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { ChaseRunRecord } from '@/lib/canonical/types';

function hourLabelFromConfig(digestHour: number): string {
  const hour = ((digestHour + 11) % 12) + 1;
  const meridiem = digestHour >= 12 ? 'PM' : 'AM';
  return `${hour}:00 ${meridiem}`;
}

export async function recordChaseRun(input: {
  tenantId: string;
  bullets: string[];
  digestHour?: number;
}): Promise<ChaseRunRecord> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(input.tenantId);
  const run: ChaseRunRecord = {
    id: randomUUID(),
    ranAt: new Date().toISOString(),
    hourLabel: hourLabelFromConfig(
      input.digestHour ?? snapshot.agentConfig?.behaviors.digestHour ?? 6
    ),
    bullets: input.bullets
  };
  snapshot.chaseRuns = [run, ...snapshot.chaseRuns].slice(0, 30);
  if (snapshot.agentConfig) {
    snapshot.agentConfig = {
      ...snapshot.agentConfig,
      digestPreview: {
        dateLabel: new Date().toISOString().slice(0, 10),
        bullets: input.bullets
      }
    };
  }
  await store.write(input.tenantId, snapshot);
  return run;
}

export async function getLatestChaseRun(tenantId: string): Promise<ChaseRunRecord | null> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  return snapshot.chaseRuns[0] ?? null;
}
