import type { ThreadEmail } from '@/features/revcollect/types';
import { stripQuotedReply } from '@/lib/email/strip-quoted-reply';
import {
  getGoogleOAuthConfig,
  isGoogleInvalidGrantError,
  refreshGoogleAccessToken
} from './google-oauth';
import {
  getGmailConnection,
  getGmailRefreshToken,
  saveGmailConnection
} from './gmail-connection-store';

const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

export type GmailConnectionErrorCode = 'gmail_expired' | 'gmail_disconnected';

export class GmailNotConnectedError extends Error {
  readonly code: GmailConnectionErrorCode;

  constructor(
    message = 'Gmail is not connected',
    code: GmailConnectionErrorCode = 'gmail_disconnected'
  ) {
    super(message);
    this.name = 'GmailNotConnectedError';
    this.code = code;
  }
}

export interface GmailSendInput {
  tenantId: string;
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  gmailThreadId?: string;
}

export interface GmailSendResult {
  gmailMessageId: string;
  gmailThreadId?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

function gmailSendFailureMessage(status: number, detail: string): string {
  const lower = detail.toLowerCase();
  if (
    lower.includes('accessnotconfigured') ||
    lower.includes('has not been used') ||
    lower.includes('gmail api')
  ) {
    return 'Gmail API is not enabled on this Google Cloud project. Enable Gmail API, wait a minute, then try Send again.';
  }
  if (lower.includes('insufficient') && lower.includes('scope')) {
    return 'Gmail is missing send permission. Reconnect Gmail and accept gmail.send when Google asks.';
  }
  if (status === 403) {
    return 'Gmail refused to send. Enable Gmail API for this Cloud project, and add your Google account as a test user.';
  }
  return `Gmail send failed (${status}).`;
}

function encodeHeaderValue(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function formatFromHeader(email: string, displayName?: string): string {
  const name = displayName?.trim();
  if (!name) return email;
  return `${encodeHeaderValue(name)} <${email}>`;
}

function buildRawMessage(input: {
  fromHeader: string;
  to: string;
  subject: string;
  body: string;
}): string {
  const encodedBody = Buffer.from(input.body, 'utf8').toString('base64');
  const rfc822 = [
    `From: ${input.fromHeader}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedBody
  ].join('\r\n');
  return Buffer.from(rfc822, 'utf8').toString('base64url');
}

async function getGmailAccessToken(
  tenantId: string
): Promise<{ accessToken: string; email: string }> {
  const config = getGoogleOAuthConfig();
  if (!config) {
    throw new GmailNotConnectedError('Gmail OAuth is not configured');
  }

  const connection = await getGmailConnection(tenantId);
  if (!connection) {
    throw new GmailNotConnectedError();
  }

  let refreshToken: string | null = null;
  try {
    refreshToken = await getGmailRefreshToken(tenantId);
  } catch (error) {
    console.error('[gmail] could not decrypt refresh token:', error);
    throw new GmailNotConnectedError('Gmail session expired. Reconnect Gmail.', 'gmail_expired');
  }

  if (!refreshToken) {
    throw new GmailNotConnectedError();
  }

  try {
    const refreshed = await refreshGoogleAccessToken(config, refreshToken);
    if (refreshed.refreshToken !== refreshToken) {
      await saveGmailConnection(tenantId, {
        email: connection.email,
        refreshToken: refreshed.refreshToken
      });
    }
    return { accessToken: refreshed.accessToken, email: connection.email };
  } catch (error) {
    if (
      isGoogleInvalidGrantError(error) ||
      (error instanceof Error && error.name === 'GoogleInvalidGrantError')
    ) {
      throw new GmailNotConnectedError('Gmail session expired. Reconnect Gmail.', 'gmail_expired');
    }
    throw error;
  }
}

export async function sendGmailMessage(input: GmailSendInput): Promise<GmailSendResult> {
  const { accessToken, email } = await getGmailAccessToken(input.tenantId);
  const raw = buildRawMessage({
    fromHeader: formatFromHeader(email, input.fromName),
    to: input.to,
    subject: input.subject,
    body: input.body
  });

  const response = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw,
      ...(input.gmailThreadId ? { threadId: input.gmailThreadId } : {})
    })
  });

  if (response.status === 401) {
    throw new GmailNotConnectedError('Gmail session expired. Reconnect Gmail.', 'gmail_expired');
  }

  if (!response.ok) {
    const detail = await response.text();
    console.error('[gmail] send failed:', response.status, detail);
    throw new Error(gmailSendFailureMessage(response.status, detail));
  }

  const payload = (await response.json()) as { id?: string; threadId?: string };
  return {
    gmailMessageId: payload.id ?? `gmail-${Date.now()}`,
    gmailThreadId: payload.threadId,
    from: email,
    to: input.to,
    subject: input.subject,
    body: input.body,
    sentAt: new Date().toISOString()
  };
}

export function sentEmailFromResult(
  result: GmailSendResult,
  input: { threadId: string; customerId: string }
): ThreadEmail {
  return {
    id: result.gmailMessageId,
    threadId: input.threadId,
    customerId: input.customerId,
    gmailThreadId: result.gmailThreadId,
    author: 'agent',
    from: result.from,
    to: [result.to],
    subject: result.subject,
    body: result.body,
    sentAt: result.sentAt
  };
}

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

interface GmailHeader {
  name?: string;
  value?: string;
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
  headers?: GmailHeader[];
}

interface GmailMessageResource {
  id?: string;
  threadId?: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailPart;
}

function gmailHeader(headers: GmailHeader[] | undefined, name: string): string {
  const match = headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return match?.value?.trim() ?? '';
}

function decodeGmailBody(data?: string): string {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function extractPlainText(part?: GmailPart): string {
  if (!part) return '';
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeGmailBody(part.body.data);
  }
  if (part.parts) {
    for (const child of part.parts) {
      const text = extractPlainText(child);
      if (text.trim()) return text;
    }
  }
  if (part.body?.data && (part.mimeType === 'text/html' || part.mimeType?.startsWith('text/'))) {
    return decodeGmailBody(part.body.data).replace(/<[^>]+>/g, ' ');
  }
  return '';
}

export function parseEmailAddresses(value: string): string[] {
  return [...value.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) =>
    match[0].toLowerCase()
  );
}

function mapGmailMessage(
  message: GmailMessageResource,
  connectedEmail: string
): {
  id: string;
  gmailThreadId?: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  sentAt: string;
  fromEmails: string[];
  author: 'agent' | 'customer';
} | null {
  if (!message.id) return null;
  const headers = message.payload?.headers;
  const from = gmailHeader(headers, 'From');
  const toHeader = gmailHeader(headers, 'To');
  const fromEmails = parseEmailAddresses(from);
  const connected = connectedEmail.trim().toLowerCase();
  const author = fromEmails.includes(connected) ? 'agent' : 'customer';
  const internalDate = message.internalDate ? Number(message.internalDate) : Date.now();
  const body = stripQuotedReply(
    extractPlainText(message.payload).trim() || message.snippet?.trim() || ''
  );
  return {
    id: message.id,
    gmailThreadId: message.threadId,
    from: from || (author === 'agent' ? connectedEmail : fromEmails[0] || 'unknown'),
    to: parseEmailAddresses(toHeader),
    subject: gmailHeader(headers, 'Subject'),
    body,
    sentAt: new Date(internalDate).toISOString(),
    fromEmails,
    author
  };
}

async function gmailGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (response.status === 401) {
    throw new GmailNotConnectedError('Gmail session expired. Reconnect Gmail.', 'gmail_expired');
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(gmailSendFailureMessage(response.status, detail));
  }
  return response.json() as Promise<T>;
}

export async function fetchGmailMessageThreadId(
  tenantId: string,
  messageId: string
): Promise<string | null> {
  const { accessToken } = await getGmailAccessToken(tenantId);
  const message = await gmailGet<{ threadId?: string }>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}?format=minimal`
  );
  return message.threadId ?? null;
}

export async function fetchGmailThreadMessages(
  tenantId: string,
  gmailThreadId: string
): Promise<NonNullable<ReturnType<typeof mapGmailMessage>>[]> {
  const { accessToken, email } = await getGmailAccessToken(tenantId);
  const thread = await gmailGet<{ messages?: GmailMessageResource[] }>(
    accessToken,
    `/threads/${encodeURIComponent(gmailThreadId)}?format=full`
  );
  return (thread.messages ?? [])
    .map((message) => mapGmailMessage(message, email))
    .filter((message): message is NonNullable<typeof message> => Boolean(message));
}

export async function searchGmailByQuery(
  tenantId: string,
  query: string,
  maxThreads = 8
): Promise<NonNullable<ReturnType<typeof mapGmailMessage>>[]> {
  const { accessToken, email } = await getGmailAccessToken(tenantId);
  const listed = await gmailGet<{ messages?: { id?: string; threadId?: string }[] }>(
    accessToken,
    `/messages?q=${encodeURIComponent(query)}&maxResults=15`
  );
  const threadIds = [
    ...new Set((listed.messages ?? []).map((item) => item.threadId).filter(Boolean))
  ] as string[];
  const threads = await Promise.all(
    threadIds
      .slice(0, maxThreads)
      .map((threadId) =>
        gmailGet<{ messages?: GmailMessageResource[] }>(
          accessToken,
          `/threads/${encodeURIComponent(threadId)}?format=full`
        )
      )
  );
  return threads.flatMap((thread) =>
    (thread.messages ?? [])
      .map((message) => mapGmailMessage(message, email))
      .filter((message): message is NonNullable<typeof message> => Boolean(message))
  );
}

export async function searchGmailFromAddress(
  tenantId: string,
  fromEmail: string
): Promise<NonNullable<ReturnType<typeof mapGmailMessage>>[]> {
  return searchGmailByQuery(tenantId, `from:${fromEmail} newer_than:90d`);
}

export async function getConnectedGmailEmail(tenantId: string): Promise<string | null> {
  try {
    const { email } = await getGmailAccessToken(tenantId);
    return email;
  } catch (error) {
    if (error instanceof GmailNotConnectedError) return null;
    throw error;
  }
}
