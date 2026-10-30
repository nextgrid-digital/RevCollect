import { gmailAfterQueryDate } from './books-connected-at';
import { getGmailAccessToken, gmailGet } from './gmail-api';

const CONVERSATION_LIST_PAGES = 8;

/** Thread ids for every Gmail conversation with this address that we have not stored yet. */
export async function listUnstoredGmailThreadIds(
  tenantId: string,
  emailAddress: string,
  knownThreadIds: ReadonlySet<string>,
  limit: number,
  afterIso?: string | null
): Promise<string[]> {
  const address = emailAddress.replace(/"/g, '').trim();
  if (!address || limit <= 0) return [];
  const after =
    afterIso && !Number.isNaN(new Date(afterIso).getTime())
      ? ` after:${gmailAfterQueryDate(afterIso)}`
      : '';
  const query = `(from:"${address}" OR to:"${address}")${after}`;
  const { accessToken } = await getGmailAccessToken(tenantId);
  const found: string[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < CONVERSATION_LIST_PAGES && found.length < limit; page += 1) {
    const params = new URLSearchParams({
      q: query,
      maxResults: '50'
    });
    if (pageToken) params.set('pageToken', pageToken);
    const listed = await gmailGet<{
      messages?: { threadId?: string }[];
      nextPageToken?: string;
    }>(accessToken, `/messages?${params.toString()}`);
    for (const item of listed.messages ?? []) {
      const threadId = item.threadId;
      if (!threadId || knownThreadIds.has(threadId) || found.includes(threadId)) continue;
      found.push(threadId);
      if (found.length >= limit) break;
    }
    if (!listed.nextPageToken) break;
    pageToken = listed.nextPageToken;
  }

  return found;
}
