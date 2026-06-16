import type { QueryClient } from '@tanstack/react-query';
import { inboxSelectionQueryOptions } from '../../api/queries';

export function prefetchInboxSelection(queryClient: QueryClient, messageId: string) {
  void queryClient.prefetchQuery(inboxSelectionQueryOptions(messageId));
}
