'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
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

export type { InboxOpenMode } from '../lib/inbox-open-mode-config';

function getFullPageMessageId(pathname: string): string | null {
  const match = pathname.match(/^\/inbox\/([^/]+)$/);
  return match?.[1] ?? null;
}

interface InboxOpenModeContextValue {
  mode: InboxOpenMode;
  setMode: (mode: InboxOpenMode) => void;
  peekMessageId: string | null;
  openMessage: (messageId: string) => void;
  closePeek: () => void;
}

const InboxOpenModeContext = createContext<InboxOpenModeContextValue | null>(null);

export function InboxOpenModeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mode, setModeState] = useState<InboxOpenMode>(DEFAULT_INBOX_OPEN_MODE);
  const [peekMessageId, setPeekMessageId] = useState<string | null>(null);

  const fullPageMessageId = getFullPageMessageId(pathname);

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
          router.push(`/inbox/${activeId}`, { scroll: false });
        } else {
          router.replace('/inbox', { scroll: false });
        }
        return;
      }

      if (nextMode === 'full') {
        setPeekMessageId(null);
        router.push(`/inbox/${activeId}`, { scroll: false });
        return;
      }

      if (isMobile) {
        router.push(`/inbox/${activeId}`, { scroll: false });
        return;
      }

      setPeekMessageId(activeId);
      if (fullPageMessageId) {
        router.replace('/inbox', { scroll: false });
      }
    },
    [fullPageMessageId, isMobile, peekMessageId, router]
  );

  const openMessage = useCallback(
    (messageId: string) => {
      if (isMobile) {
        setPeekMessageId(null);
        router.push(`/inbox/${messageId}`, { scroll: false });
        return;
      }

      if (mode === 'workspace' || mode === 'full') {
        setPeekMessageId(null);
        router.push(`/inbox/${messageId}`, { scroll: false });
        return;
      }

      setPeekMessageId(messageId);
    },
    [isMobile, mode, router]
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

export function useInboxOpenMode() {
  const context = useContext(InboxOpenModeContext);
  if (!context) {
    throw new Error('useInboxOpenMode must be used within InboxOpenModeProvider');
  }
  return context;
}
