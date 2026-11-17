import 'server-only';
import type { DeletionRequestResult } from '@/features/revcollect/api/types';
import { getCanonicalStore } from '@/lib/canonical/store';
import { GmailNotConnectedError, sendGmailMessage } from '@/lib/integrations/gmail-api';
import { getAuthUser } from '@/lib/supabase/get-auth-user';

export const PRIVACY_ADMIN_EMAIL = 'admin@revcollect.ai';

function deletionCopy(input: {
  accountName: string;
  accountEmail: string;
  companyName: string;
  tenantId: string;
}): { subject: string; body: string } {
  const who = input.accountEmail || input.companyName || input.tenantId;
  const lines = [
    'Please delete the RevCollect data for this customer.',
    '',
    `Name: ${input.accountName || 'Unknown'}`,
    `Account email: ${input.accountEmail || 'Unknown'}`,
    `Company: ${input.companyName || 'Unknown'}`,
    `Workspace id: ${input.tenantId}`,
    '',
    'Requested from Settings → Privacy and data.'
  ];
  return {
    subject: `Delete RevCollect data for ${who}`,
    body: lines.join('\n')
  };
}

function deletionMailto(subject: string, body: string): string {
  return `mailto:${PRIVACY_ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Email admin to delete this workspace. Does not erase data itself. */
export async function emailWorkspaceDeletionRequest(
  tenantId: string
): Promise<DeletionRequestResult> {
  const user = await getAuthUser();
  let companyName = '';
  try {
    const store = await getCanonicalStore();
    const snapshot = await store.read(tenantId);
    companyName = snapshot.workspaceSettings?.companyName?.trim() ?? '';
  } catch {
    companyName = '';
  }

  const accountEmail = user.email.trim();
  const { subject, body } = deletionCopy({
    accountName: user.name,
    accountEmail,
    companyName,
    tenantId
  });
  const requestId = `del-${Date.now()}`;

  try {
    await sendGmailMessage({
      tenantId,
      to: PRIVACY_ADMIN_EMAIL,
      subject,
      body,
      fromName: user.name,
      replyTo: accountEmail || undefined
    });
    return {
      requestId,
      tenantId,
      status: 'queued',
      message: `Deletion request emailed to ${PRIVACY_ADMIN_EMAIL}. We complete it within 30 days.`
    };
  } catch (error) {
    const gmailMissing = error instanceof GmailNotConnectedError;
    if (!gmailMissing) {
      console.error('[privacy] deletion email failed:', error);
    }
    return {
      requestId,
      tenantId,
      status: 'mailto',
      mailto: deletionMailto(subject, body),
      message: gmailMissing
        ? `Your email app will open a message to ${PRIVACY_ADMIN_EMAIL}. Send it to request deletion of this workspace.`
        : `We could not send from Gmail. Your email app will open a message to ${PRIVACY_ADMIN_EMAIL}. Send it to request deletion.`
    };
  }
}
