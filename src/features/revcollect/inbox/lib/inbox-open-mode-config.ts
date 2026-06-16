import type { Icon } from '@/components/icons';
import { Icons } from '@/components/icons';

export type InboxOpenMode = 'workspace' | 'side' | 'center' | 'full';

export const INBOX_OPEN_MODE_STORAGE_KEY = 'revcollect-inbox-open-mode';
export const INBOX_OPEN_MODE_CHANGE_EVENT = 'revcollect-inbox-open-mode-change';

export interface InboxOpenModeOption {
  id: InboxOpenMode;
  label: string;
  description: string;
  icon: keyof typeof Icons;
}

export const INBOX_OPEN_MODES: InboxOpenModeOption[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'List, thread, and customer insights visible together.',
    icon: 'kanban'
  },
  {
    id: 'side',
    label: 'Side peek',
    description: 'Minimal list with the thread opening in a right panel.',
    icon: 'panelLeft'
  },
  {
    id: 'center',
    label: 'Center peek',
    description: 'Minimal list with the thread opening in a centered overlay.',
    icon: 'product'
  },
  {
    id: 'full',
    label: 'Full page',
    description: 'Minimal list; each thread opens on its own page.',
    icon: 'externalLink'
  }
];

export function isInboxOpenMode(value: string): value is InboxOpenMode {
  return INBOX_OPEN_MODES.some((mode) => mode.id === value);
}

export function readInboxOpenMode(): InboxOpenMode {
  if (typeof window === 'undefined') return 'side';
  const stored = localStorage.getItem(INBOX_OPEN_MODE_STORAGE_KEY);
  if (stored && isInboxOpenMode(stored)) return stored;
  return 'side';
}

export function writeInboxOpenMode(mode: InboxOpenMode): void {
  localStorage.setItem(INBOX_OPEN_MODE_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(INBOX_OPEN_MODE_CHANGE_EVENT, { detail: mode }));
}

export function getInboxOpenModeIcon(icon: keyof typeof Icons): Icon {
  return Icons[icon];
}
