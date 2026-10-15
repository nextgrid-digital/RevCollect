/** In-memory AR cache shared by the Xero-backed service. Cleared on books disconnect. */
const AR_DATA_MEMO_TTL_MS = 8_000;

export interface ArDataMemoEntry<T> {
  expiresAt: number;
  promise: Promise<T>;
}

const arDataMemo = new Map<string, ArDataMemoEntry<unknown>>();

export function getArDataMemoTtlMs(): number {
  return AR_DATA_MEMO_TTL_MS;
}

export function getArDataMemoEntry<T>(tenantId: string): ArDataMemoEntry<T> | undefined {
  return arDataMemo.get(tenantId) as ArDataMemoEntry<T> | undefined;
}

export function setArDataMemoEntry<T>(tenantId: string, entry: ArDataMemoEntry<T>): void {
  arDataMemo.set(tenantId, entry as ArDataMemoEntry<unknown>);
}

export function clearArDataMemo(tenantId: string): void {
  arDataMemo.delete(tenantId);
}
