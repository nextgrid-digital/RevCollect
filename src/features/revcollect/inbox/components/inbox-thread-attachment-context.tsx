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

interface InboxThreadAttachmentContextValue {
  attachedInvoiceNumbers: string[];
  isAttached: (invoiceNumber: string) => boolean;
  attachInvoice: (invoiceNumber: string) => void;
  attachInvoices: (invoiceNumbers: string[]) => void;
  detachInvoice: (invoiceNumber: string) => void;
}

const InboxThreadAttachmentContext = createContext<InboxThreadAttachmentContextValue | null>(null);

interface InboxThreadAttachmentProviderProps {
  children: ReactNode;
  /** Invoice numbers to attach when the thread loads (e.g. all open invoices for AI drafts). */
  initialAttachedInvoiceNumbers?: string[];
  /** Reset attachment state when the thread changes. */
  resetKey?: string;
}

export function InboxThreadAttachmentProvider({
  children,
  initialAttachedInvoiceNumbers = [],
  resetKey
}: InboxThreadAttachmentProviderProps) {
  const [attachedInvoiceNumbers, setAttachedInvoiceNumbers] = useState<string[]>(
    initialAttachedInvoiceNumbers
  );

  useEffect(() => {
    setAttachedInvoiceNumbers(initialAttachedInvoiceNumbers);
  }, [resetKey, initialAttachedInvoiceNumbers]);

  const isAttached = useCallback(
    (invoiceNumber: string) => attachedInvoiceNumbers.includes(invoiceNumber),
    [attachedInvoiceNumbers]
  );

  const attachInvoice = useCallback((invoiceNumber: string) => {
    setAttachedInvoiceNumbers((prev) =>
      prev.includes(invoiceNumber) ? prev : [...prev, invoiceNumber]
    );
  }, []);

  const attachInvoices = useCallback((invoiceNumbers: string[]) => {
    setAttachedInvoiceNumbers((prev) => {
      const next = new Set(prev);
      for (const number of invoiceNumbers) {
        next.add(number);
      }
      return [...next];
    });
  }, []);

  const detachInvoice = useCallback((invoiceNumber: string) => {
    setAttachedInvoiceNumbers((prev) => prev.filter((number) => number !== invoiceNumber));
  }, []);

  const value = useMemo(
    () => ({
      attachedInvoiceNumbers,
      isAttached,
      attachInvoice,
      attachInvoices,
      detachInvoice
    }),
    [attachedInvoiceNumbers, isAttached, attachInvoice, attachInvoices, detachInvoice]
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
