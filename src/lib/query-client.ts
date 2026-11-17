import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** Drop any previously persisted customer and invoice rows. */
const PERSIST_KEY = 'revcollect-query-cache-v5';

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

function clearPersistedQueries(): void {
  try {
    window.localStorage.removeItem(PERSIST_KEY);
  } catch {
    // Private browsing can throw on storage access.
  }
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
export function initBrowserQueryPersistence(_queryClient: QueryClient): void {
  if (typeof window === 'undefined' || persistInitialized) {
    return;
  }
  persistInitialized = true;
  clearPersistedQueries();
}
