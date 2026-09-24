'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { BOOKS_PROVIDERS, type BooksProvider } from '@/lib/integrations/books-provider';

export type BooksPickerReturnTo = '/onboarding' | '/settings/integrations';

export interface BooksLedgerOption {
  label: string;
  description: string;
  href: string;
  connectLabel: string;
  reconnectLabel: string;
}

export const BOOKS_LEDGER_OPTIONS: Record<BooksProvider, BooksLedgerOption> = {
  xero: {
    label: 'Xero',
    description: 'Customers, invoices, and payment status sync from your organisation.',
    href: '/onboarding/connect-xero',
    connectLabel: 'Connect with Xero',
    reconnectLabel: 'Reconnect with Xero'
  },
  quickbooks: {
    label: 'QuickBooks',
    description: 'US QuickBooks Online sandbox or production company.',
    href: '/onboarding/connect-quickbooks',
    connectLabel: 'Connect',
    reconnectLabel: 'Reconnect'
  },
  zoho: {
    label: 'Zoho Books',
    description: 'Zoho Books organisation. Gmail stays the send channel.',
    href: '/onboarding/connect-zoho',
    connectLabel: 'Connect',
    reconnectLabel: 'Reconnect'
  }
};

export function booksConnectPath(provider: BooksProvider, returnTo: BooksPickerReturnTo): string {
  return `/api/integrations/${provider}/connect?returnTo=${returnTo}`;
}

export function BooksProviderPicker({ returnTo }: { returnTo: BooksPickerReturnTo }) {
  const [provider, setProvider] = useState<BooksProvider | ''>('');
  const option = provider ? BOOKS_LEDGER_OPTIONS[provider] : null;

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-muted-foreground text-sm'>
        {option?.description ?? 'Choose Xero, QuickBooks, or Zoho Books. One ledger per workspace.'}
      </p>
      <div className='space-y-2'>
        <Label id='books-provider-label' htmlFor='books-provider'>
          Accounting software
        </Label>
        <Select
          value={provider || undefined}
          onValueChange={(value) => setProvider(value as BooksProvider)}
        >
          <SelectTrigger
            id='books-provider'
            aria-labelledby='books-provider-label'
            className='w-full sm:max-w-xs'
          >
            <SelectValue placeholder='Select accounting software' />
          </SelectTrigger>
          <SelectContent>
            {BOOKS_PROVIDERS.map((key) => (
              <SelectItem key={key} value={key}>
                {BOOKS_LEDGER_OPTIONS[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {option && provider ? (
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-xs'>
            Already connected before? Reconnect if access was revoked.
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button asChild size='sm'>
              <Link href={option.href}>{option.connectLabel}</Link>
            </Button>
            <Button asChild size='sm' variant='outline'>
              <Link href={booksConnectPath(provider, returnTo)}>{option.reconnectLabel}</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
