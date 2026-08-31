import { parseJsonBody } from '@/lib/json/parse-json-body';
import type { SendInboxFollowUpInput, SendInboxFollowUpResult } from '../api/service';

export type InboxSendErrorCode = 'gmail_expired' | 'gmail_disconnected';

export interface InboxSendError extends Error {
  status?: number;
  code?: InboxSendErrorCode;
}

/** @deprecated Use sendInboxFollowUpRequest */
export async function recordInboxSend(input: SendInboxFollowUpInput): Promise<void> {
  await sendInboxFollowUpRequest(input);
}

export async function sendInboxFollowUpRequest(
  input: SendInboxFollowUpInput
): Promise<SendInboxFollowUpResult> {
  const response = await fetch('/api/revcollect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      op: 'recordInboxSend',
      payload: input
    })
  });
  const text = await response.text();
  if (!response.ok) {
    const detail = (() => {
      try {
        return parseJsonBody<{ error?: string; code?: InboxSendErrorCode }>(text);
      } catch {
        return null;
      }
    })();
    const error: InboxSendError = new Error(detail?.error ?? 'Could not send follow-up');
    error.status = response.status;
    error.code = detail?.code;
    throw error;
  }
  return parseJsonBody<SendInboxFollowUpResult>(text);
}
