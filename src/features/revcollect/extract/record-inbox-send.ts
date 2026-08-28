export async function recordInboxSend(input: {
  customerId: string;
  originalBody?: string;
  sentBody: string;
  kind?: 'reply' | 'draft_edit';
}): Promise<void> {
  await fetch('/api/revcollect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      op: 'recordInboxSend',
      payload: input
    })
  });
}
