'use client';

import { useEffect, useState } from 'react';
import { AUDIT_PROCESSING, auditCompletionLine } from '@/features/audit/lib/ui-copy';

interface AuditProcessingStatusProps {
  isPending: boolean;
  isSummarizing: boolean;
  invoiceCount: number | null;
  customerCount: number | null;
  /** Full-viewport panel while computing; compact banner for completion flash. */
  variant?: 'panel' | 'banner';
}

export function AuditProcessingStatus({
  isPending,
  isSummarizing,
  invoiceCount,
  customerCount,
  variant = 'banner'
}: AuditProcessingStatusProps) {
  const active = isPending || isSummarizing;
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!active) {
      if (invoiceCount != null && customerCount != null) {
        setCompleted(true);
        const timer = window.setTimeout(() => setCompleted(false), 4000);
        return () => window.clearTimeout(timer);
      }
      return;
    }
    setCompleted(false);
    setIndex(0);
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % AUDIT_PROCESSING.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [active, invoiceCount, customerCount]);

  if (!active && !completed) return null;

  const line =
    active || invoiceCount == null || customerCount == null
      ? AUDIT_PROCESSING[index]
      : auditCompletionLine(invoiceCount, customerCount);

  if (variant === 'panel') {
    return (
      <div className='mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 py-24 sm:px-8 print:hidden'>
        <div className='audit-panel-keylime flex w-full max-w-xl flex-col items-center gap-3 p-10 text-center'>
          <p className='font-audit-sans text-audit-ink text-[16px] leading-[1.5]'>{line}</p>
          <p className='font-audit-sans text-audit-muted text-[12px]'>
            The report appears when every number and narrative line is ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <p className='font-audit-sans text-audit-muted mx-auto max-w-[1200px] px-6 pt-4 text-[13px] print:hidden'>
      {line}
    </p>
  );
}
