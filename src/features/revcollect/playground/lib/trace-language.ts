import type { JevScore } from '@/lib/ai/jev';
import {
  estimateJevUsage,
  formatUsd,
  formatUsageLine,
  priceTokens,
  type ModelCallUsage
} from '@/lib/ai/model-usage';
import type { DecisionTrace } from '@/lib/ari/decision-trace-types';

export type StepId = 'customer' | 'memory' | 'decision' | 'gemini' | 'result' | 'learn';

export type StepStatus = 'idle' | 'used' | 'skipped' | 'blocked' | 'allowed';

export interface StepView {
  id: StepId;
  title: string;
  status: StepStatus;
  summary: string;
  detail: string | null;
  locked: boolean;
}

export const FLOW_IDS: StepId[] = ['customer', 'memory', 'decision', 'gemini', 'result', 'learn'];

const CHECKS: Array<{ title: string; gates: string[] }> = [
  { title: 'They promised to pay', gates: ['promised'] },
  { title: 'The bill is disputed', gates: ['in_dispute', 'active_dispute'] },
  { title: 'We must not contact them', gates: ['do_not_contact'] },
  { title: 'Follow-up is paused', gates: ['paused'] },
  { title: 'They said they already paid', gates: ['payment_claimed'] },
  {
    title: 'A person needs to decide first',
    gates: [
      'sensitive_suggestion',
      'sensitive_event',
      'resume_review',
      'founder_only',
      'manual_only'
    ]
  }
];

const ACTION_COPY: Record<string, string> = {
  draft_follow_up: 'Write a payment reminder',
  draft_promise_check: 'Check a broken promise',
  draft_payment_verification: 'Ask for a payment reference',
  wait_for_promise: 'Wait for the promised date',
  skip: 'Do not write a draft',
  escalate_human: 'A person should decide',
  do_not_contact: 'Do not contact this customer'
};

const GATE_COPY: Record<string, string> = {
  promised: 'Stopped: they promised to pay',
  in_dispute: 'Stopped: this invoice is in dispute',
  do_not_contact: 'Stopped: this customer is do-not-contact',
  active_dispute: 'Stopped: there is an active dispute',
  sensitive_suggestion: 'Stopped: a sensitive event was suggested',
  sensitive_event: 'Stopped: a sensitive event is on this account',
  payment_claimed: 'Stopped: they said they already paid',
  paused: 'Stopped: follow-up is paused',
  resume_review: 'Stopped: a person should review before contact resumes',
  founder_only: 'Stopped: only a founder should contact them',
  manual_only: 'Stopped: this account is manual only',
  customer_not_found: 'Stopped: that customer was not found'
};

const IDLE: Record<StepId, Pick<StepView, 'title' | 'summary' | 'locked'>> = {
  customer: { title: 'Who', summary: 'The customer this run is about.', locked: true },
  memory: {
    title: 'What we know',
    summary: 'How they pay, and how to write to them.',
    locked: true
  },
  decision: {
    title: 'Should we write?',
    summary: 'We stop for a promise, a dispute, or a pause.',
    locked: true
  },
  gemini: {
    title: 'Write the draft',
    summary: 'An email is written only if the answer above is yes.',
    locked: false
  },
  result: {
    title: 'You review it',
    summary: 'You read the draft here. Nothing is sent.',
    locked: true
  },
  learn: {
    title: 'Next time',
    summary: 'The tone and any note you save are used again.',
    locked: false
  }
};

const PLAYBOOK_LINE =
  'One email does not become a habit. That waits until 5 reminders are followed by a payment.';

export function actionCopy(action: string | null): string {
  if (!action) return 'Not scored';
  return ACTION_COPY[action] ?? action.replaceAll('_', ' ');
}

export function gateCopy(gate: string | null): string {
  if (!gate) return 'Allowed through';
  return GATE_COPY[gate] ?? `Stopped: ${gate.replaceAll('_', ' ')}`;
}

export function outcomeCopy(trace: DecisionTrace): string {
  if (trace.gate) return gateCopy(trace.gate);
  return actionCopy(trace.codeAction);
}

export interface RunReadout {
  context: string | null;
  scores: string[];
  draft: string | null;
  draftNote: string;
  cost: string[];
  costNote: string;
  evals: string[];
}

function scoreLine(score: JevScore): string {
  if (score.kind === 'choice') {
    const confidence =
      score.confidence == null ? '' : ` · ${Math.round(score.confidence * 100)}% sure`;
    return `${score.label}: ${actionCopy(score.value)}${confidence}`;
  }
  return `${score.label}: ${score.value}`;
}

function draftNote(source: DecisionTrace['draftSource']): string {
  if (source === 'gemini') return 'Written from the notes below.';
  if (source === 'template')
    return 'The usual email was kept. The writer did not return a usable draft.';
  if (source === 'gateway') return 'A backup writer wrote this from the notes below.';
  return 'No draft was written.';
}

function step(id: StepId, status: StepStatus, summary: string, detail: string | null): StepView {
  return {
    id,
    title: IDLE[id].title,
    status,
    summary,
    detail,
    locked: IDLE[id].locked
  };
}

function splitFactPack(text: string): { live: string; intelligence: string } {
  const marker = '## Type 2 Patterns';
  const index = text.indexOf(marker);
  if (index < 0) return { live: text.trim(), intelligence: '' };
  let live = text.slice(0, index).trim();
  live = live.replace(/^Use ONLY the data provided\.[^\n]*\n?/, '').trim();
  live = live.replace(/^## Type 1 Facts[^\n]*\n?/, '').trim();
  return { live, intelligence: text.slice(index).trim() };
}

function checkIndex(gate: string): number {
  return CHECKS.findIndex((check) => check.gates.includes(gate));
}

function plainReason(gate: string | null): string {
  const text = gateCopy(gate).replace(/^Stopped: /, '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function decisionDetail(gate: string | null): string {
  const match = gate ? checkIndex(gate) : -1;
  const lines = CHECKS.map((check, index) => {
    if (!gate) return `${check.title}: no`;
    if (match < 0) return `${check.title}: not checked`;
    if (index < match) return `${check.title}: no`;
    if (index === match) return `${check.title}: yes, so we stop`;
    return `${check.title}: not checked`;
  });
  return lines.join('\n');
}

function plainContext(intelligence: string, live: string): string {
  const known = intelligence
    .replace(/^## Type 2 Patterns[^\n]*\n?/, 'How they pay\n')
    .replace(/\n## Type 3 Situations[^\n]*\n?/, '\n\nOpen situations\n')
    .replace(/\n## Type 4 Preferences\n?/, '\n\nHow to write to them\n')
    .replace(/\nRelationship state: /, '\n\nRelationship: ')
    .replace(/\nPending relationship suggestion: /, '\nWaiting on a person: ')
    .trim();
  const bills = live
    .replace(/^Customer: /, 'Account: ')
    .replace(/\nOpen balance: /, '\nStill owed: ')
    .replace(/\nOldest days overdue: /, '\nMost overdue, in days: ')
    .replace(/\nOpen invoices:\n/, '\nOpen bills:\n')
    .trim();
  return [known, bills].filter(Boolean).join('\n\n');
}

export function describePipeline(
  trace: DecisionTrace | null,
  instruction = ''
): Record<StepId, StepView> {
  const idle = Object.fromEntries(
    (Object.keys(IDLE) as StepId[]).map((id) => [id, step(id, 'idle', IDLE[id].summary, null)])
  ) as Record<StepId, StepView>;
  if (!trace) return idle;

  const stopped = Boolean(trace.gate);
  const parts = splitFactPack(trace.factPack);
  const known = plainContext(parts.intelligence, parts.live);
  const views = { ...idle };

  views.customer = step(
    'customer',
    trace.gate === 'customer_not_found' ? 'blocked' : 'used',
    trace.gate === 'customer_not_found' ? plainReason(trace.gate) : trace.company,
    null
  );

  views.memory = step(
    'memory',
    known ? 'used' : 'skipped',
    known ? 'How they pay, and how to write to them.' : 'Nothing stored for this customer yet.',
    known || null
  );

  views.decision = step(
    'decision',
    stopped ? 'blocked' : 'allowed',
    stopped ? `No. ${plainReason(trace.gate)}.` : 'Yes. Nothing is in the way.',
    decisionDetail(trace.gate)
  );

  const draftSummary =
    trace.draftSource === 'gemini'
      ? 'A draft was written.'
      : trace.draftSource === 'template'
        ? 'The usual email was kept.'
        : trace.draftSource === 'gateway'
          ? 'A backup writer wrote this.'
          : 'Not written.';
  const suggestion =
    trace.scores.length > 0
      ? `A second look suggested: ${actionCopy(trace.jevAction)}.`
      : stopped
        ? 'No second look, because we did not write.'
        : 'A second look did not run.';

  views.gemini = step(
    'gemini',
    trace.draftSource === 'none' ? 'skipped' : 'used',
    draftSummary,
    [suggestion, trace.brief ? 'The notes were shortened before writing.' : '']
      .filter(Boolean)
      .join('\n')
  );

  views.result = step(
    'result',
    trace.draftBody ? 'used' : stopped ? 'blocked' : 'skipped',
    trace.draftBody ? 'Ready for you. Nothing was sent.' : 'Nothing to read. Nothing was sent.',
    trace.draftBody
  );

  const kept = Boolean(trace.note?.trim()) || Boolean(instruction.trim());
  views.learn = step(
    'learn',
    kept ? 'used' : 'skipped',
    kept
      ? 'Saved for next time.'
      : 'Nothing new to save. Next time still uses the tone and greeting you already set.',
    PLAYBOOK_LINE
  );

  return views;
}

function describeCost(trace: DecisionTrace): { lines: string[]; note: string } {
  const jev =
    trace.usage?.jev ??
    (trace.scores.length > 0
      ? estimateJevUsage(trace.factPack, trace.draftBody, trace.jevModel ?? 'jev-1.14.0')
      : null);
  const writer = trace.usage?.writer ?? null;
  const lines = [
    jev ? formatUsageLine('Jev', jev) : 'Jev: no token count. Scoring did not run.',
    writer
      ? formatUsageLine('Writer', writer)
      : trace.draftSource === 'template'
        ? 'Writer: no token count. The usual email was kept.'
        : trace.draftSource === 'none'
          ? 'Writer: no token count. Nothing was written.'
          : 'Writer: no token count was saved for this run.'
  ];
  const priced = [jev, writer].filter((item): item is ModelCallUsage => item?.usd != null);
  if (priced.length > 0) {
    const total = priced.reduce((sum, item) => sum + (item.usd ?? 0), 0);
    const about = priced.some((item) => item.counted === 'estimate') ? 'about ' : '';
    lines.push(`Total: ${about}${formatUsd(total)}`);
  }
  const notes = ['Jev is $0.042 per million tokens in. Output is free.'];
  if (priced.some((item) => item.counted === 'estimate')) {
    notes.push(
      'Older runs estimate tokens at 4 characters each. A new run saves the provider count.'
    );
  }
  const writerNote = writer
    ? priceTokens(writer.model, writer.inputTokens, writer.outputTokens).note
    : null;
  if (writerNote) notes.push(writerNote);
  return { lines, note: notes.join(' ') };
}

export function describeRun(trace: DecisionTrace | null): RunReadout | null {
  if (!trace) return null;
  const parts = splitFactPack(trace.factPack);
  const context = plainContext(parts.intelligence, parts.live) || null;
  const cost = describeCost(trace);
  return {
    context,
    scores: trace.scores.map(scoreLine),
    draft: trace.draftBody,
    draftNote: draftNote(trace.draftSource),
    cost: cost.lines,
    costNote: cost.note,
    evals: (trace.evals ?? []).map((item) => `${item.pass ? 'Pass' : 'Fail'}. ${item.detail}`)
  };
}
