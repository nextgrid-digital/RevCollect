/**
 * Intuit stamps every API response with `intuit_tid`.
 * Capture it so their support team can trace a specific call.
 */
export function readIntuitTid(response: Response): string | null {
  const value = response.headers.get('intuit_tid')?.trim();
  return value || null;
}

export function captureIntuitTid(operation: string, response: Response): string | null {
  const intuitTid = readIntuitTid(response);
  const payload = {
    operation,
    status: response.status,
    intuit_tid: intuitTid
  };
  if (!response.ok) {
    console.error('[intuit] request failed', payload);
  } else {
    console.info('[intuit] intuit_tid', payload);
  }
  return intuitTid;
}

export function withIntuitTid(message: string, intuitTid: string | null): string {
  return intuitTid ? `${message} intuit_tid=${intuitTid}` : message;
}
