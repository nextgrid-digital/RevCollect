import { generateGeminiText } from '@/lib/ai/gemini';
import {
  readHarnessReply,
  type HarnessGraph
} from '@/features/revcollect/playground/lib/harness-graph';

const SYSTEM = [
  'You update a collections-agent flow diagram from a conversation.',
  'Return only JSON: {"reply":"one short sentence","nodes":[{"id":"books","title":"Books","summary":"Open invoices and the balance."}],"edges":[{"source":"books","target":"decision"}]}.',
  'Ids are lowercase letters, numbers, and hyphens.',
  'Do not include nodes named decision or result. Those stay in the product: the checks, and a person who sends.',
  'Do not add a node that sends email.',
  'Keep the flow to the specialists the person asked for. A specialist returns a narrow result, not a second full email.',
  'reply is what you tell the person. It is not a node title.'
].join(' ');

export async function architectHarness(input: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  graph: HarnessGraph;
}): Promise<{ reply: string; graph: HarnessGraph }> {
  const transcript = input.messages
    .slice(-8)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');
  const prompt = [
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
  const parsed = readHarnessReply(generated.text);
  if (!parsed) {
    throw new Error('The harness did not return a flow.');
  }
  return parsed;
}
