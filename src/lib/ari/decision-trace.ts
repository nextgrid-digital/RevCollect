import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { CanonicalSnapshot } from '@/lib/canonical/types';
import type { DecisionTrace } from '@/lib/ari/decision-trace-types';

export type { DecisionTrace } from '@/lib/ari/decision-trace-types';

const MAX_TRACES = 40;
const TRACE_DIR = path.join(process.cwd(), '.data', 'playground');

function safeTenantId(tenantId: string): string {
  return tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function tracePath(tenantId: string): string {
  return path.join(TRACE_DIR, `${safeTenantId(tenantId)}.json`);
}

export function pushDecisionTrace(snapshot: CanonicalSnapshot, trace: DecisionTrace): void {
  const current = snapshot.decisionTraces ?? [];
  snapshot.decisionTraces = [trace, ...current].slice(0, MAX_TRACES);
}

export async function readDecisionTraceFile(tenantId: string): Promise<DecisionTrace[]> {
  try {
    const raw = await readFile(tracePath(tenantId), 'utf8');
    const parsed = JSON.parse(raw) as DecisionTrace[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeDecisionTraceFile(
  tenantId: string,
  traces: DecisionTrace[]
): Promise<void> {
  await mkdir(TRACE_DIR, { recursive: true });
  await writeFile(tracePath(tenantId), JSON.stringify(traces.slice(0, MAX_TRACES)), 'utf8');
}
