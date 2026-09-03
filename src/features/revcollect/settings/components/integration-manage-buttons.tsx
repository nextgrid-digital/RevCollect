'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  useDisconnectIntegration,
  useResyncXero,
  type IntegrationProviderKey
} from '../../api/queries';

function disconnectCopy(provider: IntegrationProviderKey): string {
  switch (provider) {
    case 'gmail':
      return 'You can reconnect later. RevCollect will stop sending and reading mail from this account.';
    case 'xero':
      return 'You can reconnect later with Connect with Xero. Existing invoices stay until you resync.';
    case 'quickbooks':
      return 'You can reconnect later. Existing invoices stay until you resync.';
    case 'zoho':
      return 'You can reconnect later. Existing invoices stay until you resync.';
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

export function IntegrationDisconnectButton({
  provider,
  label
}: {
  provider: IntegrationProviderKey;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const disconnect = useDisconnectIntegration();
  const xeroLabel = provider === 'xero' ? 'Disconnect from Xero' : `Disconnect ${label}`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size='sm' variant='outline'>
          {xeroLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {label}?</AlertDialogTitle>
          <AlertDialogDescription>{disconnectCopy(provider)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disconnect.isPending}
            onClick={(event) => {
              event.preventDefault();
              disconnect.mutate(provider, {
                onSuccess: () => setOpen(false)
              });
            }}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function IntegrationReconnectLinks({
  returnTo
}: {
  returnTo: '/onboarding' | '/settings/integrations';
}) {
  return (
    <>
      <Button asChild size='sm'>
        <Link href={`/api/integrations/xero/connect?returnTo=${returnTo}`}>
          Reconnect with Xero
        </Link>
      </Button>
      <Button asChild size='sm' variant='outline'>
        <Link href={`/api/integrations/quickbooks/connect?returnTo=${returnTo}`}>
          Reconnect QuickBooks
        </Link>
      </Button>
      <Button asChild size='sm' variant='outline'>
        <Link href={`/api/integrations/zoho/connect?returnTo=${returnTo}`}>Reconnect Zoho</Link>
      </Button>
      <Button asChild size='sm' variant='outline'>
        <Link href={`/api/integrations/gmail/connect?returnTo=${returnTo}`}>Reconnect Gmail</Link>
      </Button>
    </>
  );
}

export function XeroResyncButton() {
  const resync = useResyncXero();
  return (
    <Button
      size='sm'
      variant='outline'
      isLoading={resync.isPending}
      onClick={() => resync.mutate()}
    >
      Resync
    </Button>
  );
}
