import type { QueryClient } from '@tanstack/react-query';
import { getRevCollectService } from '../../api';
import { inboxSelectionQueryOptions } from '../../api/queries';

export function prefetchInboxSelection(queryClient: QueryClient, messageId: string) {
  void queryClient
    .prefetchQuery({
      ...inboxSelectionQueryOptions(messageId),
      queryFn: () => getRevCollectService().getInboxSelectionData(messageId, { soft: true })
    })
    .catch(() => {});
}
