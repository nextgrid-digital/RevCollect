import { QueryClient, defaultShouldDehydrateQuery, hydrate, isServer } from '@tanstack/react-query';
import {
  persistQueryClientSubscribe,
  type PersistedClient
} from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const PERSIST_KEY = 'revcollect-query-cache-v2';

function shouldPersistQuery(query: {
  queryKey: readonly unknown[];
  state: { status: string };
}): boolean {
  return (
    query.state.status === 'success' &&
    query.queryKey[0] === 'revcollect' &&
    query.queryKey[1] !== 'inbox'
  );
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: PERSIST_MAX_AGE_MS
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending'
      }
    }
  });
}

function restorePersistedQueries(queryClient: QueryClient): void {
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return;
    const persisted = JSON.parse(raw) as PersistedClient;
    if (!persisted?.clientState || Date.now() - persisted.timestamp > PERSIST_MAX_AGE_MS) {
      window.localStorage.removeItem(PERSIST_KEY);
      return;
    }
    hydrate(queryClient, persisted.clientState);
    void queryClient.invalidateQueries({ queryKey: ['revcollect', 'inbox'] });
  } catch {
    window.localStorage.removeItem(PERSIST_KEY);
  }
}

function persistBrowserQueryClient(queryClient: QueryClient): void {
  restorePersistedQueries(queryClient);
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: PERSIST_KEY
  });
  persistQueryClientSubscribe({
    queryClient,
    persister,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => shouldPersistQuery(query)
    }
  });
}

let browserQueryClient: QueryClient | undefined = undefined;
let persistInitialized = false;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

// Restore after mount so persisted cache cannot diverge from SSR HTML.
export function initBrowserQueryPersistence(queryClient: QueryClient): void {
  if (typeof window === 'undefined' || persistInitialized) {
    return;
  }
  persistInitialized = true;
  persistBrowserQueryClient(queryClient);
}
