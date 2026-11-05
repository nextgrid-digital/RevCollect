import {
  validateCollectionLanguage,
  validateDraftAgainstFacts,
  type CollectionLanguageOptions,
  type DraftFacts
} from '@/lib/ai/validators';
import type { DecisionTrace, DraftEval } from '@/lib/ari/decision-trace-types';

const SENT_CLAIM =
  /this (email|message) was sent|i have sent|i['’]ve sent|email has been sent|already been sent/i;

export function scoreKeptDraft(input: {
  body: string;
  draftSource: DecisionTrace['draftSource'];
  facts: DraftFacts;
  language: CollectionLanguageOptions;
  replied: boolean;
}): DraftEval[] {
  if (!input.body.trim() || input.draftSource === 'none') return [];

  const facts = validateDraftAgainstFacts(input.body, input.facts);
  const language = validateCollectionLanguage(input.body, input.language);
  const claimedSent = SENT_CLAIM.test(input.body);

  const checks: DraftEval[] = [
    {
      id: 'facts',
      pass: facts.ok,
      detail: facts.ok
        ? 'The invoice numbers, amounts, and dates match the notes.'
        : 'It names an invoice, amount, or date that is not in the notes.'
    },
    {
      id: 'language',
      pass: language.ok,
      detail: language.ok
        ? 'The wording stays inside the workspace rules.'
        : 'It uses language the workspace does not allow.'
    },
    {
      id: 'not_sent',
      pass: !claimedSent,
      detail: claimedSent
        ? 'It claims the email was already sent.'
        : 'It does not claim the email was already sent.'
    }
  ];

  if (input.replied) {
    const answered = input.draftSource === 'gemini' || input.draftSource === 'gateway';
    checks.push({
      id: 'answered_reply',
      pass: answered,
      detail: answered
        ? 'It answers what they wrote.'
        : 'Their message was not answered. The usual email was kept.'
    });
  }

  return checks;
}
