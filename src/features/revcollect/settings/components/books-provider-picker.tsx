'use client';

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
import { IntuitIcon } from '@/components/icons/intuit-icon';
import { XeroIcon } from '@/components/icons/xero-icon';
import { ZohoIcon } from '@/components/icons/zoho-icon';
import { BOOKS_PROVIDERS, type BooksProvider } from '@/lib/integrations/books-provider';
import {
  defaultZohoDataCenterIdForClient,
  ZOHO_DATA_CENTERS,
  type ZohoDataCenterId
} from '@/lib/integrations/zoho-regions';
import { OAuthStartLink } from './oauth-start-link';

export type BooksPickerReturnTo = '/onboarding' | '/settings/integrations';

export interface BooksLedgerOption {
  label: string;
  description: string;
  connectLabel: string;
  reconnectLabel: string;
}

export const BOOKS_LEDGER_OPTIONS: Record<BooksProvider, BooksLedgerOption> = {
  xero: {
    label: 'Xero',
    description: 'Customers, invoices, and payment status sync from your organisation.',
    connectLabel: 'Connect with Xero',
    reconnectLabel: 'Reconnect with Xero'
  },
  quickbooks: {
    label: 'QuickBooks',
    description: 'US QuickBooks Online sandbox or production company.',
    connectLabel: 'Connect QuickBooks',
    reconnectLabel: 'Reconnect QuickBooks'
  },
  zoho: {
    label: 'Zoho Books',
    description: 'Zoho Books organisation. Gmail stays the send channel.',
    connectLabel: 'Connect Zoho Books',
    reconnectLabel: 'Reconnect Zoho Books'
  }
};

export function booksConnectPath(
  provider: BooksProvider,
  returnTo: BooksPickerReturnTo,
  zohoDc?: ZohoDataCenterId
): string {
  const params = new URLSearchParams({ returnTo });
  if (provider === 'zoho' && zohoDc) params.set('dc', zohoDc);
  return `/api/integrations/${provider}/connect?${params.toString()}`;
}

export function BooksLedgerMark({
  provider,
  className = 'size-4 shrink-0'
}: {
  provider: BooksProvider;
  className?: string;
}) {
  switch (provider) {
    case 'xero':
      return <XeroIcon className={className} />;
    case 'quickbooks':
      return <IntuitIcon className={className} />;
    case 'zoho':
      return <ZohoIcon className={className} />;
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

function BooksLedgerOptionLabel({ provider }: { provider: BooksProvider }) {
  return (
    <span className='flex items-center gap-2'>
      <BooksLedgerMark provider={provider} />
      {BOOKS_LEDGER_OPTIONS[provider].label}
    </span>
  );
}

export function BooksProviderPicker({ returnTo }: { returnTo: BooksPickerReturnTo }) {
  const [provider, setProvider] = useState<BooksProvider | ''>('');
  const [zohoDc, setZohoDc] = useState<ZohoDataCenterId>(defaultZohoDataCenterIdForClient);
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
                <BooksLedgerOptionLabel provider={key} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {provider === 'zoho' ? (
        <div className='space-y-2'>
          <Label htmlFor='books-zoho-dc'>Country</Label>
          <Select value={zohoDc} onValueChange={(value) => setZohoDc(value as ZohoDataCenterId)}>
            <SelectTrigger id='books-zoho-dc' className='w-full sm:max-w-xs'>
              <SelectValue placeholder='Select region' />
            </SelectTrigger>
            <SelectContent>
              {ZOHO_DATA_CENTERS.map((dc) => (
                <SelectItem key={dc.id} value={dc.id}>
                  {dc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {option && provider ? (
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-xs'>
            You&apos;ll sign in with {option.label} and come back here.
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button asChild size='sm'>
              <OAuthStartLink
                href={booksConnectPath(provider, returnTo, provider === 'zoho' ? zohoDc : undefined)}
              >
                <BooksLedgerMark provider={provider} />
                {option.connectLabel}
              </OAuthStartLink>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
