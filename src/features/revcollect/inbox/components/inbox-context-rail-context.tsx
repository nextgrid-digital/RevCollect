'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from 'react';
import { cn } from '@/lib/utils';

interface InboxContextRailContextValue {
  railContent: ReactNode | null;
  setRailContent: Dispatch<SetStateAction<ReactNode | null>>;
}

const InboxContextRailContext = createContext<InboxContextRailContextValue | null>(null);

export function InboxContextRailProvider({ children }: { children: ReactNode }) {
  const [railContent, setRailContent] = useState<ReactNode | null>(null);

  const value = useMemo(
    () => ({
      railContent,
      setRailContent
    }),
    [railContent]
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
  const { railContent } = useInboxContextRail();

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-l lg:flex',
        className
      )}
    >
      {railContent}
    </aside>
  );
}
