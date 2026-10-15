import { listBooksConnections, newestBooksProvider } from './books-exclusivity';

/** When the active books ledger was connected — used to ignore older Gmail history. */
export async function getBooksConnectedAt(tenantId: string): Promise<string | null> {
  const hits = await listBooksConnections(tenantId);
  const keep = newestBooksProvider(hits);
  if (!keep) return null;
  return hits.find((hit) => hit.provider === keep)?.connectedAt ?? null;
}

export function filterEmailsSince<T extends { sentAt: string }>(
  emails: T[],
  sinceIso: string | null | undefined
): T[] {
  if (!sinceIso) return emails;
  const sinceMs = new Date(sinceIso).getTime() - 60_000;
  if (Number.isNaN(sinceMs)) return emails;
  return emails.filter((email) => {
    const sentMs = new Date(email.sentAt).getTime();
    return !Number.isNaN(sentMs) && sentMs >= sinceMs;
  });
}

/** Gmail `after:yyyy/mm/dd` from an ISO timestamp (day of connect, UTC). */
export function gmailAfterQueryDate(sinceIso: string): string {
  const date = new Date(sinceIso);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}
