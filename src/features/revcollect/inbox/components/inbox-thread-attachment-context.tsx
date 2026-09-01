'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { MAX_INVOICE_ATTACHMENTS, type InvoiceRef } from '../../lib/invoice-pdf';

interface InboxThreadAttachmentContextValue {
  attachedInvoices: InvoiceRef[];
  attachedInvoiceIds: string[];
  isAttached: (invoiceId: string) => boolean;
  attachInvoice: (invoice: InvoiceRef) => void;
  attachInvoices: (invoices: InvoiceRef[]) => void;
  detachInvoice: (invoiceId: string) => void;
  toggleInvoice: (invoice: InvoiceRef) => void;
}

const InboxThreadAttachmentContext = createContext<InboxThreadAttachmentContextValue | null>(null);

interface InboxThreadAttachmentProviderProps {
  children: ReactNode;
  /** Invoices to attach when the thread loads (e.g. all open invoices for AI drafts). */
  initialAttachedInvoices?: InvoiceRef[];
  /** Reset attachment state when the thread changes. */
  resetKey?: string;
}

export function InboxThreadAttachmentProvider({
  children,
  initialAttachedInvoices = [],
  resetKey
}: InboxThreadAttachmentProviderProps) {
  const [attachedInvoices, setAttachedInvoices] = useState<InvoiceRef[]>(() =>
    initialAttachedInvoices.slice(0, MAX_INVOICE_ATTACHMENTS)
  );
  const initialKey = `${resetKey ?? ''}:${initialAttachedInvoices.map((invoice) => invoice.id).join(',')}`;

  useEffect(() => {
    setAttachedInvoices(initialAttachedInvoices.slice(0, MAX_INVOICE_ATTACHMENTS));
    // Reset when the thread or seed invoice set changes — not on array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialKey captures seed identity
  }, [initialKey]);

  const isAttached = useCallback(
    (invoiceId: string) => attachedInvoices.some((invoice) => invoice.id === invoiceId),
    [attachedInvoices]
  );

  const attachInvoice = useCallback((invoice: InvoiceRef) => {
    setAttachedInvoices((prev) => {
      if (prev.some((item) => item.id === invoice.id)) return prev;
      if (prev.length >= MAX_INVOICE_ATTACHMENTS) return prev;
      return [...prev, invoice];
    });
  }, []);

  const attachInvoices = useCallback((invoices: InvoiceRef[]) => {
    setAttachedInvoices((prev) => {
      const next = new Map(prev.map((invoice) => [invoice.id, invoice]));
      for (const invoice of invoices) {
        if (next.size >= MAX_INVOICE_ATTACHMENTS && !next.has(invoice.id)) {
          continue;
        }
        next.set(invoice.id, invoice);
      }
      return [...next.values()];
    });
  }, []);

  const detachInvoice = useCallback((invoiceId: string) => {
    setAttachedInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
  }, []);

  const toggleInvoice = useCallback((invoice: InvoiceRef) => {
    setAttachedInvoices((prev) => {
      if (prev.some((item) => item.id === invoice.id)) {
        return prev.filter((item) => item.id !== invoice.id);
      }
      if (prev.length >= MAX_INVOICE_ATTACHMENTS) return prev;
      return [...prev, invoice];
    });
  }, []);

  const attachedInvoiceIds = useMemo(
    () => attachedInvoices.map((invoice) => invoice.id),
    [attachedInvoices]
  );

  const value = useMemo(
    () => ({
      attachedInvoices,
      attachedInvoiceIds,
      isAttached,
      attachInvoice,
      attachInvoices,
      detachInvoice,
      toggleInvoice
    }),
    [
      attachedInvoices,
      attachedInvoiceIds,
      isAttached,
      attachInvoice,
      attachInvoices,
      detachInvoice,
      toggleInvoice
    ]
  );

  return (
    <InboxThreadAttachmentContext.Provider value={value}>
      {children}
    </InboxThreadAttachmentContext.Provider>
  );
}

export function useInboxThreadAttachment() {
  const context = useContext(InboxThreadAttachmentContext);
  if (!context) {
    throw new Error('useInboxThreadAttachment must be used within InboxThreadAttachmentProvider');
  }
  return context;
}

export function useOptionalInboxThreadAttachment() {
  return useContext(InboxThreadAttachmentContext);
}
