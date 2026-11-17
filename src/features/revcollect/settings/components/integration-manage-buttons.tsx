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
import { ConnectToQuickBooksButton } from './connect-to-quickbooks-button';
import { OAuthStartLink } from './oauth-start-link';
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
      return 'This revokes the QuickBooks token and stops sync. Invoices already saved stay until you delete workspace data.';
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
  const triggerLabel =
    provider === 'xero'
      ? 'Disconnect from Xero'
      : provider === 'quickbooks'
        ? 'Disconnect from QuickBooks'
        : `Disconnect ${label}`;
  const dialogTitle =
    provider === 'quickbooks' ? 'Disconnect from QuickBooks?' : `Disconnect ${label}?`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size='sm' variant='outline'>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>{disconnectCopy(provider)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disconnect.isPending}
            onClick={(event) => {
              event.preventDefault();
              setOpen(false);
              disconnect.mutate(provider);
            }}
          >
            {provider === 'quickbooks' ? 'Disconnect from QuickBooks' : 'Disconnect'}
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
        <OAuthStartLink href={`/api/integrations/xero/connect?returnTo=${returnTo}`}>
          Reconnect with Xero
        </OAuthStartLink>
      </Button>
      <ConnectToQuickBooksButton
        href={`/api/integrations/quickbooks/connect?returnTo=${returnTo}`}
      />
      <Button asChild size='sm' variant='outline'>
        <Link href={`/onboarding/connect-zoho`}>Reconnect Zoho</Link>
      </Button>
      <Button asChild size='sm' variant='outline'>
        <OAuthStartLink href={`/api/integrations/gmail/connect?returnTo=${returnTo}`}>
          Reconnect Gmail
        </OAuthStartLink>
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
