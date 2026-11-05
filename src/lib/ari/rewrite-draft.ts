import { generateDraftText, isDraftModelConfigured } from '@/lib/ari/generate-draft-text';
import { validateCollectionLanguage, validateQueuedDraft } from '@/lib/ai/validators';
import { assembleCustomerContext } from '@/features/revcollect/context/assemble-context';
import { DEFAULT_AGENT_CONFIG, defaultWorkspaceAgentConfig } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';

const MAX_INSTRUCTION_CHARS = 400;
const MAX_BODY_CHARS = 8000;

export class AriRewriteError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AriRewriteError';
    this.status = status;
  }
}

export async function rewriteAgentDraft(input: {
  tenantId: string;
  customerId: string;
  body: string;
  instruction: string;
}): Promise<{ body: string }> {
  const instruction = input.instruction.trim();
  const body = input.body.trim();
  if (!instruction) {
    throw new AriRewriteError('Tell ARI how to edit the draft.');
  }
  if (instruction.length > MAX_INSTRUCTION_CHARS) {
    throw new AriRewriteError('Keep the edit instruction under 400 characters.');
  }
  if (!body) {
    throw new AriRewriteError('There is no draft to rewrite.');
  }
  if (body.length > MAX_BODY_CHARS) {
    throw new AriRewriteError('This draft is too long to rewrite.');
  }
  if (!isDraftModelConfigured()) {
    throw new AriRewriteError(
      'ARI is not connected. Add a Gemini API key before rewriting drafts.',
      503
    );
  }

  const assembled = await assembleCustomerContext(input.tenantId, input.customerId);
  if (!assembled) {
    throw new AriRewriteError('Customer not found.', 404);
  }

  const store = await getCanonicalStore();
  const snapshot = await store.read(input.tenantId);
  const config = snapshot.agentConfig ?? defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
  const languageOptions = {
    allowLegalLanguage: config.behaviors.allowLegalLanguage,
    allowLateFeeMentions: config.behaviors.allowLateFeeMentions
  };

  let generated: { text: string };
  try {
    generated = await generateDraftText({
      temperature: 0.3,
      system: [
        'You rewrite collection email drafts for human approval.',
        'Use ONLY the facts provided. Do not invent invoice numbers, amounts, dates, or names.',
        'Do not claim the email was sent.',
        'Do not mention legal action, penalties, late fees, or that the customer is avoiding payment.',
        'Follow the edit instruction for tone and length only.',
        'Return only the rewritten email body.'
      ].join(' '),
      prompt: [
        assembled.promptBlock,
        '',
        'Current draft:',
        body,
        '',
        'Edit instruction:',
        instruction
      ].join('\n')
    });
  } catch (error) {
    console.error(
      '[rewriteAgentDraft] model request failed',
      error instanceof Error ? error.name : 'Error'
    );
    throw new AriRewriteError('ARI could not rewrite this draft. Try again.', 502);
  }

  const rewritten = unwrapEmail(generated.text);
  if (!rewritten) {
    throw new AriRewriteError('ARI returned an empty draft. Try a different instruction.', 502);
  }

  const validation = validateQueuedDraft(rewritten, assembled.facts, languageOptions);
  if (!validation.ok) {
    const language = validateCollectionLanguage(rewritten, languageOptions);
    throw new AriRewriteError(
      language.ok
        ? 'That rewrite added invoice details that are not on this account. Try a different instruction.'
        : 'That rewrite used language ARI is not allowed to send. Try a different instruction.'
    );
  }

  const draftIndex = snapshot.drafts.findIndex((item) => item.customerId === input.customerId);
  if (draftIndex >= 0) {
    const existing = snapshot.drafts[draftIndex];
    snapshot.drafts = snapshot.drafts.map((item, index) =>
      index === draftIndex
        ? { ...existing, body: rewritten, preparedAt: new Date().toISOString() }
        : item
    );
    await store.write(input.tenantId, snapshot);
  }

  return { body: rewritten };
}

function unwrapEmail(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:\w+)?\s*([\s\S]*?)```$/);
  return (fenced?.[1] ?? trimmed).trim();
}
