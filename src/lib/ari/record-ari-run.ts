import { randomUUID } from 'crypto';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { AriRunRecord } from '@/lib/canonical/types';

function hourLabelFromConfig(digestHour: number): string {
  const hour = ((digestHour + 11) % 12) + 1;
  const meridiem = digestHour >= 12 ? 'PM' : 'AM';
  return `${hour}:00 ${meridiem}`;
}

export async function recordAriRun(input: {
  tenantId: string;
  bullets: string[];
  digestHour?: number;
}): Promise<AriRunRecord> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(input.tenantId);
  const run: AriRunRecord = {
    id: randomUUID(),
    ranAt: new Date().toISOString(),
    hourLabel: hourLabelFromConfig(
      input.digestHour ?? snapshot.agentConfig?.behaviors.digestHour ?? 6
    ),
    bullets: input.bullets
  };
  snapshot.ariRuns = [run, ...snapshot.ariRuns].slice(0, 30);
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

export async function getLatestAriRun(tenantId: string): Promise<AriRunRecord | null> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  return snapshot.ariRuns[0] ?? null;
}
