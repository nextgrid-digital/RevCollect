'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { invoicePdfPath, type InvoiceRef } from '../../lib/invoice-pdf';

interface InboxAttachedInvoiceChipsProps {
  invoices: InvoiceRef[];
  onDetach?: (invoiceId: string) => void;
  disabled?: boolean;
}

export function InboxAttachedInvoiceChips({
  invoices,
  onDetach,
  disabled = false
}: InboxAttachedInvoiceChipsProps) {
  if (invoices.length === 0) {
    return <p className='text-muted-foreground text-xs'>No invoices attached</p>;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className='bg-muted/70 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs'
        >
          <Icons.fileTypePdf className='text-muted-foreground size-3.5 shrink-0' />
          <a
            href={invoicePdfPath(invoice.id)}
            target='_blank'
            rel='noopener noreferrer'
            className='text-foreground hover:text-foreground/80 font-medium tabular-nums underline-offset-2 hover:underline'
            aria-label={`Preview ${invoice.number} PDF`}
          >
            {invoice.number}
          </a>
          {onDetach && !disabled ? (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:text-foreground size-5 shrink-0'
              onClick={() => onDetach(invoice.id)}
              aria-label={`Remove ${invoice.number}`}
            >
              <Icons.close className='size-3' />
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
