export interface HarnessNode {
  id: string;
  title: string;
  summary: string;
  locked: boolean;
}

export interface HarnessEdge {
  source: string;
  target: string;
  label?: string;
}

export interface HarnessGraph {
  nodes: HarnessNode[];
  edges: HarnessEdge[];
}

const LOCKED: HarnessNode[] = [
  {
    id: 'decision',
    title: 'Should we write?',
    summary: 'The checks stay on. A chat cannot turn them off.',
    locked: true
  },
  {
    id: 'result',
    title: 'You review it',
    summary: 'A person sends. Nothing here sends mail.',
    locked: true
  }
];

const ID_PATTERN = /^[a-z0-9-]{1,40}$/;

export function defaultHarnessGraph(): HarnessGraph {
  return {
    nodes: [
      { id: 'customer', title: 'Who', summary: 'The customer this job is about.', locked: false },
      {
        id: 'memory',
        title: 'What we know',
        summary: 'How they pay, and how to write to them.',
        locked: false
      },
      LOCKED[0],
      {
        id: 'gemini',
        title: 'Write the draft',
        summary: 'One writer, from the notes.',
        locked: false
      },
      LOCKED[1],
      {
        id: 'learn',
        title: 'Next time',
        summary: 'A later change waits until a person approves it.',
        locked: false
      }
    ],
    edges: [
      { source: 'customer', target: 'memory' },
      { source: 'memory', target: 'decision' },
      { source: 'decision', target: 'gemini' },
      { source: 'gemini', target: 'result' },
      { source: 'result', target: 'learn' },
      { source: 'learn', target: 'memory', label: 'Next time' }
    ]
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function sanitizeHarnessGraph(raw: unknown): HarnessGraph {
  const record = asRecord(raw);
  const proposed = Array.isArray(record?.nodes) ? record.nodes : [];
  const byId = new Map<string, HarnessNode>();

  for (const item of proposed) {
    const node = asRecord(item);
    const id = cleanText(node?.id, 40);
    if (!ID_PATTERN.test(id) || LOCKED.some((locked) => locked.id === id)) continue;
    const title = cleanText(node?.title, 48);
    const summary = cleanText(node?.summary, 120);
    if (!title) continue;
    byId.set(id, { id, title, summary: summary || title, locked: false });
    if (byId.size >= 10) break;
  }

  const nodes = [...byId.values()];
  const decisionAt = nodes.findIndex((node) => node.id === 'gemini' || node.id === 'writer');
  const insertAt = decisionAt >= 0 ? decisionAt : nodes.length;
  nodes.splice(insertAt, 0, LOCKED[0]);
  const reviewAt = nodes.findIndex((node) => node.id === 'learn');
  nodes.splice(reviewAt >= 0 ? reviewAt : nodes.length, 0, LOCKED[1]);

  const ids = new Set(nodes.map((node) => node.id));
  const edges: HarnessEdge[] = [];
  const seen = new Set<string>();
  const proposedEdges = Array.isArray(record?.edges) ? record.edges : [];
  for (const item of proposedEdges) {
    const edge = asRecord(item);
    const source = cleanText(edge?.source, 40);
    const target = cleanText(edge?.target, 40);
    if (!ids.has(source) || !ids.has(target) || source === target) continue;
    const key = `${source}->${target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const label = cleanText(edge?.label, 24);
    edges.push(label ? { source, target, label } : { source, target });
    if (edges.length >= 16) break;
  }

  if (edges.length === 0) {
    for (let index = 0; index < nodes.length - 1; index += 1) {
      edges.push({ source: nodes[index].id, target: nodes[index + 1].id });
    }
  }

  for (const locked of LOCKED) {
    const index = nodes.findIndex((node) => node.id === locked.id);
    if (index > 0 && !edges.some((edge) => edge.target === locked.id)) {
      edges.push({ source: nodes[index - 1].id, target: locked.id });
    }
    if (
      index >= 0 &&
      index < nodes.length - 1 &&
      !edges.some((edge) => edge.source === locked.id)
    ) {
      edges.push({ source: locked.id, target: nodes[index + 1].id });
    }
  }

  return { nodes, edges };
}

function cleanReply(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export function readHarnessChat(
  text: string,
  current: HarnessGraph
): { reply: string; graph: HarnessGraph; updated: boolean } | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    const plain = cleanReply(text, 1600);
    return plain ? { reply: plain, graph: current, updated: false } : null;
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      reply?: unknown;
      updateFlow?: unknown;
      nodes?: unknown;
      edges?: unknown;
    };
    const reply = cleanReply(parsed.reply, 1600);
    if (!reply) return null;
    const hasNodes = Array.isArray(parsed.nodes) && parsed.nodes.length > 0;
    if (parsed.updateFlow !== true || !hasNodes) {
      return { reply, graph: current, updated: false };
    }
    return { reply, graph: sanitizeHarnessGraph(parsed), updated: true };
  } catch {
    const plain = cleanReply(text, 1600);
    return plain ? { reply: plain, graph: current, updated: false } : null;
  }
}
