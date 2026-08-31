import { useSyncExternalStore } from 'react';

const subscribeNoop = () => () => {};

/** True only after hydration. Uses the server snapshot during SSR so markup matches. */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}
