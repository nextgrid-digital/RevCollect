import type { CollectionPlaybook, CollectionTone } from '../composer-options';

const TONE_OPENERS: Record<CollectionTone, string> = {
  professional: 'Thank you for your message.',
  friendly: 'Hi — thanks for getting back to us.',
  firm: 'Please note the following regarding your account.'
};

const TONE_CLOSERS: Record<CollectionTone, string> = {
  professional: 'Please let us know if you have any questions.',
  friendly: 'Happy to help if anything else comes up on your side.',
  firm: 'We need a confirmed payment date within two business days to avoid further escalation.'
};

const PLAYBOOK_BODIES: Record<CollectionPlaybook, string> = {
  standard:
    'We are following up on the open balance on your account. Please confirm when payment will be released or if any invoices require clarification from our billing team.',
  dispute:
    'To resolve the open dispute, please share the invoice numbers in question and any supporting documentation. Our billing team will review credits and adjustments and respond with a reconciled statement.',
  final_notice:
    'This is a final notice regarding your overdue balance. Unless payment or a written payment commitment is received within five business days, the account may be referred for further collection action per your agreement terms.'
};

export type BuildCollectionDraftInput = {
  baseDraft: string;
  tone: CollectionTone;
  playbook: CollectionPlaybook;
  signature?: string;
};

function stripTrailingSignature(text: string, signature: string): string {
  const normalizedSig = signature.trim();
  if (!normalizedSig) return text.trim();
  if (text.trimEnd().endsWith(normalizedSig)) {
    return text.trimEnd().slice(0, -normalizedSig.length).trimEnd();
  }
  return text.trim();
}

export function buildCollectionDraft({
  baseDraft,
  tone,
  playbook,
  signature = 'Best regards,\nRevCollect Collections Team'
}: BuildCollectionDraftInput): string {
  const core = stripTrailingSignature(baseDraft, signature);
  const middle = PLAYBOOK_BODIES[playbook];
  const opener = TONE_OPENERS[tone];
  const closer = TONE_CLOSERS[tone];

  const parts = [opener, middle, closer];
  if (core && !parts.some((p) => core.includes(p.slice(0, 24)))) {
    parts.splice(1, 0, core);
  }

  const body = parts.join('\n\n');
  return `${body}\n\n${signature.trim()}`;
}
