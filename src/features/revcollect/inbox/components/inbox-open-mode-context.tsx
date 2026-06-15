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

export type InboxOpenMode = 'side' | 'center' | 'full';

const STORAGE_KEY = 'revcollect-inbox-open-mode';

function readStoredMode(): InboxOpenMode {
  if (typeof window === 'undefined') return 'full';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'side' || stored === 'center' || stored === 'full') return stored;
  return 'full';
}

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
  const [mode, setModeState] = useState<InboxOpenMode>('full');
  const [peekMessageId, setPeekMessageId] = useState<string | null>(null);

  const fullPageMessageId = getFullPageMessageId(pathname);

  useEffect(() => {
    setModeState(readStoredMode());
  }, []);

  useEffect(() => {
    if (pathname === '/inbox') return;
    if (fullPageMessageId) {
      setPeekMessageId(null);
    }
  }, [fullPageMessageId, pathname]);

  const setMode = useCallback(
    (nextMode: InboxOpenMode) => {
      setModeState(nextMode);
      localStorage.setItem(STORAGE_KEY, nextMode);

      const activeId = peekMessageId ?? fullPageMessageId;
      if (!activeId) return;

      if (nextMode === 'full') {
        setPeekMessageId(null);
        router.push(`/inbox/${activeId}`);
        return;
      }

      if (isMobile) {
        router.push(`/inbox/${activeId}`);
        return;
      }

      setPeekMessageId(activeId);
      if (fullPageMessageId) {
        router.replace('/inbox');
      }
    },
    [fullPageMessageId, isMobile, peekMessageId, router]
  );

  const openMessage = useCallback(
    (messageId: string) => {
      const effectiveMode = isMobile ? 'full' : mode;

      if (effectiveMode === 'full') {
        setPeekMessageId(null);
        router.push(`/inbox/${messageId}`);
        return;
      }

      setPeekMessageId(messageId);
    },
    [isMobile, mode, router]
  );

  const closePeek = useCallback(() => {
    setPeekMessageId(null);
  }, []);

  const value = useMemo(
    () => ({
      mode: isMobile ? ('full' as const) : mode,
      setMode,
      peekMessageId,
      openMessage,
      closePeek
    }),
    [closePeek, isMobile, mode, openMessage, peekMessageId, setMode]
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
