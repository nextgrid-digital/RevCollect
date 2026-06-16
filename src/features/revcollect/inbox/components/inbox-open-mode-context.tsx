'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  INBOX_OPEN_MODE_CHANGE_EVENT,
  readInboxOpenMode,
  writeInboxOpenMode,
  DEFAULT_INBOX_OPEN_MODE,
  type InboxOpenMode
} from '../lib/inbox-open-mode-config';
import { getInboxMessageIdFromPath, preserveInboxListQueryPath } from '../lib/inbox-list-query';

export type { InboxOpenMode } from '../lib/inbox-open-mode-config';

interface InboxOpenModeContextValue {
  mode: InboxOpenMode;
  setMode: (mode: InboxOpenMode) => void;
  peekMessageId: string | null;
  openMessage: (messageId: string) => void;
  closePeek: () => void;
}

const InboxOpenModeContext = createContext<InboxOpenModeContextValue | null>(null);

function InboxOpenModeProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [mode, setModeState] = useState<InboxOpenMode>(DEFAULT_INBOX_OPEN_MODE);
  const [peekMessageId, setPeekMessageId] = useState<string | null>(null);

  const fullPageMessageId = getInboxMessageIdFromPath(pathname);

  useEffect(() => {
    setModeState(readInboxOpenMode());
  }, []);

  useEffect(() => {
    const onModeChange = (event: Event) => {
      const nextMode = (event as CustomEvent<InboxOpenMode>).detail;
      if (nextMode) {
        setModeState(nextMode);
      }
    };

    window.addEventListener(INBOX_OPEN_MODE_CHANGE_EVENT, onModeChange);
    return () => window.removeEventListener(INBOX_OPEN_MODE_CHANGE_EVENT, onModeChange);
  }, []);

  useEffect(() => {
    if (pathname === '/inbox') return;
    if (fullPageMessageId) {
      setPeekMessageId(null);
    }
  }, [fullPageMessageId, pathname]);

  const setMode = useCallback(
    (nextMode: InboxOpenMode) => {
      if (isMobile) return;

      setModeState(nextMode);
      writeInboxOpenMode(nextMode);

      const activeId = peekMessageId ?? fullPageMessageId;
      if (!activeId) return;

      if (nextMode === 'workspace') {
        setPeekMessageId(null);
        if (activeId) {
          router.push(preserveInboxListQueryPath(activeId, searchParams), { scroll: false });
        } else {
          router.replace(preserveInboxListQueryPath(null, searchParams), { scroll: false });
        }
        return;
      }

      if (nextMode === 'full') {
        setPeekMessageId(null);
        router.push(preserveInboxListQueryPath(activeId, searchParams), { scroll: false });
        return;
      }

      if (isMobile) {
        router.push(preserveInboxListQueryPath(activeId, searchParams), { scroll: false });
        return;
      }

      setPeekMessageId(activeId);
      if (fullPageMessageId) {
        router.replace(preserveInboxListQueryPath(null, searchParams), { scroll: false });
      }
    },
    [fullPageMessageId, isMobile, peekMessageId, router, searchParams]
  );

  const openMessage = useCallback(
    (messageId: string) => {
      if (isMobile) {
        setPeekMessageId(null);
        router.push(preserveInboxListQueryPath(messageId, searchParams), { scroll: false });
        return;
      }

      if (mode === 'workspace' || mode === 'full') {
        setPeekMessageId(null);
        router.push(preserveInboxListQueryPath(messageId, searchParams), { scroll: false });
        return;
      }

      setPeekMessageId(messageId);
    },
    [isMobile, mode, router, searchParams]
  );

  const closePeek = useCallback(() => {
    setPeekMessageId(null);
  }, []);

  const effectiveMode = isMobile ? 'workspace' : mode;

  const value = useMemo(
    () => ({
      mode: effectiveMode,
      setMode,
      peekMessageId,
      openMessage,
      closePeek
    }),
    [closePeek, effectiveMode, openMessage, peekMessageId, setMode]
  );

  return <InboxOpenModeContext.Provider value={value}>{children}</InboxOpenModeContext.Provider>;
}

export function InboxOpenModeProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <InboxOpenModeProviderInner>{children}</InboxOpenModeProviderInner>
    </Suspense>
  );
}

export function useInboxOpenMode() {
  const context = useContext(InboxOpenModeContext);
  if (!context) {
    throw new Error('useInboxOpenMode must be used within InboxOpenModeProvider');
  }
  return context;
}
