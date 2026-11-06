import { assembleCustomerContext } from '@/features/revcollect/context/assemble-context';
import type { Customer } from '@/features/revcollect/types';
import { formatCurrencyWhole } from '@/features/revcollect/utils';
import { generateGeminiText } from '@/lib/ai/gemini';
import { getCanonicalStore } from '@/lib/canonical/store';
import { latestUnansweredCustomerReply } from '@/lib/canonical/sent-emails';
import { stripQuotedReply } from '@/lib/email/strip-quoted-reply';
import {
  readHarnessChat,
  type HarnessGraph
} from '@/features/revcollect/playground/lib/harness-graph';

const SYSTEM = [
  'You are the collections harness. Answer the person in the chat.',
  'Return only JSON: {"reply":"the answer","updateFlow":false}.',
  'Set updateFlow to true only when they ask to add, remove, or change a step on the diagram.',
  'When updateFlow is true, also return nodes and edges: {"reply":"what changed","updateFlow":true,"nodes":[{"id":"books","title":"Books","summary":"Open invoices and the balance."}],"edges":[{"source":"books","target":"decision"}]}.',
  'A question about a customer, a balance, a promise, or what you know is an answer. Set updateFlow to false. Do not add a step to hold the answer.',
  'Use only the notes. Do not invent amounts, dates, invoice numbers, or names. If the customer is not in the notes, say that.',
  'Ids are lowercase letters, numbers, and hyphens.',
  'Do not include nodes named decision or result. Those stay: the checks, and a person who sends.',
  'Do not add a node that sends email.',
  'reply is the chat message. It can be several sentences. It is not a node title.'
].join(' ');

function mentionsCustomer(question: string, customer: Customer): boolean {
  const asked = question.toLowerCase();
  const company = customer.company.trim().toLowerCase();
  const name = customer.name.trim().toLowerCase();
  if (company.length >= 3 && asked.includes(company)) return true;
  if (name.length >= 3 && name !== company && asked.includes(name)) return true;
  return company
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4)
    .some((word) => asked.includes(word));
}

export function asksForAnAnswer(text: string): boolean {
  return /\?|\b(what|who|how|why|when|tell me|give me|do you know|everything you know|status|about|update me)\b/i.test(
    text
  );
}

export function asksToChangeFlow(text: string): boolean {
  return /\b(add|remove|delete|rename|insert|move|rewire|specialist|diagram|node|step|flow)\b/i.test(
    text
  );
}

async function workspaceNotes(tenantId: string, question: string): Promise<string> {
  const snapshot = await (await getCanonicalStore()).read(tenantId);
  const directory = snapshot.customers
    .slice(0, 40)
    .map((customer) => {
      const promised = customer.promisedDate ? `, promised ${customer.promisedDate}` : '';
      return `${customer.company}: ${formatCurrencyWhole(customer.balanceCents)} open, ${customer.daysOverdue} days overdue, ${customer.status}${promised}`;
    })
    .join('\n');
  const matches = snapshot.customers.filter((customer) => mentionsCustomer(question, customer));
  const details: string[] = [];
  for (const customer of matches.slice(0, 2)) {
    const assembled = await assembleCustomerContext(tenantId, customer.id);
    const reply = latestUnansweredCustomerReply(snapshot.sentEmails ?? [], customer.id);
    const replyText = reply ? stripQuotedReply(reply.body).trim().slice(0, 500) : '';
    const traces = (snapshot.decisionTraces ?? [])
      .filter((trace) => trace.customerId === customer.id)
      .slice(0, 3)
      .map((trace) => {
        const checks = (trace.evals ?? [])
          .map((item) => `${item.pass ? 'pass' : 'fail'}: ${item.detail}`)
          .join('; ');
        return `- ${trace.createdAt.slice(0, 16)} ${trace.gate ?? trace.codeAction}${trace.note ? `. Note: ${trace.note}` : ''}${checks ? `. Checks: ${checks}` : ''}`;
      })
      .join('\n');
    details.push(
      [
        assembled?.promptBlock ?? `${customer.company} is on the list, with no further notes.`,
        replyText ? `Latest unanswered reply:\n${replyText}` : 'Latest unanswered reply: none',
        traces ? `Recent decisions:\n${traces}` : 'Recent decisions: none'
      ].join('\n')
    );
  }
  return [
    'Customers:',
    directory || 'none',
    '',
    details.length > 0 ? details.join('\n\n') : 'No customer in the question matched the list.'
  ].join('\n');
}

export async function architectHarness(input: {
  tenantId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  graph: HarnessGraph;
}): Promise<{ reply: string; graph: HarnessGraph; updated: boolean }> {
  const latest = input.messages.at(-1)?.content ?? '';
  const answerOnly = asksForAnAnswer(latest) && !asksToChangeFlow(latest);
  const transcript = input.messages
    .slice(-8)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');
  const notes = await workspaceNotes(input.tenantId, latest);
  const prompt = [
    answerOnly
      ? 'This message asks for information. Set updateFlow to false. Do not propose nodes.'
      : 'Change the flow only when they ask to change the diagram.',
    '',
    'Notes:',
    notes,
    '',
    'Current flow:',
    JSON.stringify(input.graph),
    '',
    'Conversation:',
    transcript
  ].join('\n');
  const generated = await generateGeminiText({
    system: SYSTEM,
    prompt,
    temperature: 0.2
  });
  const parsed = readHarnessChat(generated.text, input.graph);
  if (!parsed) {
    throw new Error('The harness did not answer.');
  }
  if (answerOnly) {
    return { reply: parsed.reply, graph: input.graph, updated: false };
  }
  return parsed;
}
