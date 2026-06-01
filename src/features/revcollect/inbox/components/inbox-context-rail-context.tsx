'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from 'react';
import { getDefaultInboxMessageId } from '../../mock-data';
import { cn } from '@/lib/utils';
import { InboxContextRailContent } from './inbox-context-rail-content';

interface InboxContextRailContextValue {
  selectedMessageId: string;
  setSelectedMessageId: Dispatch<SetStateAction<string>>;
  onActivityEmailClick: (emailId: string) => void;
  registerActivityEmailClick: (handler: (emailId: string) => void) => void;
}

const InboxContextRailContext = createContext<InboxContextRailContextValue | null>(null);

export function InboxContextRailProvider({ children }: { children: ReactNode }) {
  const [selectedMessageId, setSelectedMessageId] = useState(getDefaultInboxMessageId);
  const activityEmailClickRef = useRef<(emailId: string) => void>(() => {});

  const registerActivityEmailClick = useCallback((handler: (emailId: string) => void) => {
    activityEmailClickRef.current = handler;
  }, []);

  const onActivityEmailClick = useCallback((emailId: string) => {
    activityEmailClickRef.current(emailId);
  }, []);

  const value = useMemo(
    () => ({
      selectedMessageId,
      setSelectedMessageId,
      onActivityEmailClick,
      registerActivityEmailClick
    }),
    [selectedMessageId, onActivityEmailClick, registerActivityEmailClick]
  );

  return (
    <InboxContextRailContext.Provider value={value}>{children}</InboxContextRailContext.Provider>
  );
}

export function useInboxContextRail() {
  const context = useContext(InboxContextRailContext);
  if (!context) {
    throw new Error('useInboxContextRail must be used within InboxContextRailProvider');
  }
  return context;
}

export function InboxContextRailMount({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-l lg:flex',
        className
      )}
    >
      <InboxContextRailContent />
    </aside>
  );
}
