import type { CollectionPlaybook, CollectionTone } from '../composer-options';

const TONE_CLOSERS: Record<CollectionTone, string> = {
  professional: 'Please let us know if you have any questions.',
  friendly: 'Happy to help if anything else comes up on your side.',
  firm: 'Please confirm a payment date within two business days.'
};

export type BuildCollectionDraftInput = {
  baseDraft: string;
  tone: CollectionTone;
  playbook: CollectionPlaybook;
  signature?: string;
  customerName?: string;
};

function stripTrailingSignature(text: string, signature: string): string {
  const normalizedSig = signature.trim();
  if (!normalizedSig) return text.trim();
  if (text.trimEnd().endsWith(normalizedSig)) {
    return text.trimEnd().slice(0, -normalizedSig.length).trimEnd();
  }
  return text.trim();
}

/**
 * Prefer the account-specific base draft (invoice numbers, amounts, due dates).
 * Only soft-adjust the closer for tone/playbook — never stitch unrelated fragments.
 */
export function buildCollectionDraft({
  baseDraft,
  tone,
  playbook,
  signature = 'Best regards',
  customerName
}: BuildCollectionDraftInput): string {
  const core = stripTrailingSignature(baseDraft, signature).trim();
  if (core) {
    return `${core}\n\n${signature.trim()}`;
  }

  const greeting = customerName ? `Hi ${customerName},` : 'Hello,';
  const middle =
    playbook === 'payment_verification'
      ? 'Thank you for noting that payment may be on the way. A payment reference or remittance advice helps us match it to the open invoice.'
      : playbook === 'dispute_hold'
        ? 'Thanks for flagging this. We have paused collection while we review. Please share any supporting detail so we can resolve it.'
        : 'We are following up on the open balance on your account. Please confirm when payment will be released, or if any invoices need clarification.';
  const closer =
    playbook === 'payment_verification' || playbook === 'dispute_hold'
      ? 'Please let us know if you have any questions.'
      : TONE_CLOSERS[tone];

  return `${greeting}\n\n${middle}\n\n${closer}\n\n${signature.trim()}`;
}
