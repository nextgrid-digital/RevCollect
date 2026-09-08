'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useAgentAddonStatus,
  useBillingPortal,
  useConfirmCheckoutSession,
  useStartCheckout
} from '../../api/queries';
import { formatCurrencyWhole } from '../../utils';
import { PRICING_INVOICE_TIER_NOTE } from '@/lib/billing/pricing';
import { MetricBlock } from '../../components/metric-block';
import { SettingsSection } from './settings-section';

export function SettingsBillingView() {
  const searchParams = useSearchParams();
  const highlightAgent = searchParams.get('addon') === 'agent';
  const checkoutState = searchParams.get('checkout');
  const sessionId = searchParams.get('session_id');
  const addonCardRef = useRef<HTMLDivElement>(null);
  const confirmedSessionRef = useRef<string | null>(null);
  const { data: billing } = useAgentAddonStatus();
  const checkout = useStartCheckout();
  const billingPortal = useBillingPortal();
  const confirmCheckout = useConfirmCheckoutSession();

  useEffect(() => {
    if (!highlightAgent || !addonCardRef.current) return;
    addonCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightAgent]);

  useEffect(() => {
    if (checkoutState !== 'success' || !sessionId) return;
    if (confirmedSessionRef.current === sessionId) return;
    confirmedSessionRef.current = sessionId;
    confirmCheckout.mutate(sessionId);
  }, [checkoutState, confirmCheckout, sessionId]);

  const inTrial = Boolean(billing?.inTrial);
  const canWrite = billing?.canWrite !== false;
  const hasAgent = Boolean(billing?.canRunAgent);
  const hasBasePaid = Boolean(billing?.hasBase) && !inTrial;
  const hasCustomer = Boolean(billing?.stripeCustomerId);
  const baseLabel = formatCurrencyWhole(billing?.basePriceMonthlyCents ?? 4900);
  const agentLabel = formatCurrencyWhole(billing?.priceMonthlyCents ?? 3900);
  const bundleLabel = formatCurrencyWhole(
    (billing?.basePriceMonthlyCents ?? 4900) + (billing?.priceMonthlyCents ?? 3900)
  );

  let planValue = 'Read-only';
  let planDescription = 'Subscribe to send, sync, and collect.';
  if (inTrial) {
    planValue = 'Trial';
    planDescription = `${billing?.daysLeft ?? 0} days left · no card required`;
  } else if (hasBasePaid) {
    planValue = 'RevCollect';
    planDescription = `${baseLabel}/month · ${PRICING_INVOICE_TIER_NOTE}`;
  }

  let agentValue = 'Off';
  if (inTrial) {
    agentValue = 'Included';
  } else if (hasAgent) {
    agentValue = 'Active';
  }

  return (
    <div className='divide-border divide-y'>
      <div className='grid gap-6 pb-6 sm:grid-cols-3'>
        <MetricBlock
          label='Plan'
          value={planValue}
          description={<p className='text-muted-foreground text-xs'>{planDescription}</p>}
        />
        <MetricBlock
          label='Agent'
          value={agentValue}
          description={
            <p className='text-muted-foreground text-xs'>
              {checkoutState === 'cancel'
                ? 'Checkout cancelled'
                : `${agentLabel}/month after trial`}
            </p>
          }
        />
        <MetricBlock
          label='Payment'
          value={hasCustomer ? 'Stripe' : 'Not set'}
          description={
            <p className='text-muted-foreground text-xs'>
              {hasCustomer ? 'Manage cards in the Stripe portal' : 'Added when you subscribe'}
            </p>
          }
        />
      </div>

      <SettingsSection title='Workspace' className='pt-6'>
        <div className='flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0 space-y-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-sm font-semibold'>RevCollect</h3>
              {inTrial ? <Badge variant='secondary'>Free month</Badge> : null}
              {hasBasePaid ? <Badge variant='secondary'>Subscribed</Badge> : null}
              {!canWrite ? <Badge variant='outline'>Read-only</Badge> : null}
            </div>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              Inbox, aging, books sync, and collections follow-up. {PRICING_INVOICE_TIER_NOTE}.
            </p>
            <p className='text-muted-foreground text-xs'>{baseLabel}/month after the first month</p>
          </div>
          <div className='flex shrink-0 flex-wrap gap-2'>
            {hasBasePaid ? (
              <Button
                type='button'
                variant='outline'
                isLoading={billingPortal.isPending}
                onClick={() => billingPortal.mutate()}
              >
                Manage billing
              </Button>
            ) : (
              <>
                <Button
                  type='button'
                  onClick={() => checkout.mutate('base')}
                  isLoading={checkout.isPending}
                >
                  Subscribe {baseLabel}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => checkout.mutate('base_and_agent')}
                  isLoading={checkout.isPending}
                >
                  With Agent {bundleLabel}
                </Button>
              </>
            )}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title='Add-ons' className='pt-6'>
        <div
          ref={addonCardRef}
          className={
            highlightAgent
              ? 'ring-primary/30 rounded-lg ring-2 ring-offset-2 ring-offset-background'
              : undefined
          }
        >
          <div className='flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='text-sm font-semibold'>Collections Agent</h3>
                {hasAgent ? <Badge variant='secondary'>Included</Badge> : null}
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                AI-drafted follow-ups, daily digest, and promise tracking. Included in the free
                month; {agentLabel}/month after.
              </p>
              <p className='text-muted-foreground text-xs'>
                Typical AI usage ~{formatCurrencyWhole(billing?.estimatedAiCostMonthlyCents ?? 400)}
                /mo
              </p>
            </div>
            <div className='flex shrink-0 flex-wrap gap-2'>
              {hasAgent && !inTrial ? (
                <Button
                  type='button'
                  variant='outline'
                  isLoading={billingPortal.isPending}
                  onClick={() => billingPortal.mutate()}
                >
                  Manage billing
                </Button>
              ) : (
                <Button
                  type='button'
                  onClick={() => checkout.mutate(hasBasePaid ? 'agent' : 'base_and_agent')}
                  isLoading={checkout.isPending}
                >
                  {hasBasePaid ? `Add Agent ${agentLabel}` : `Subscribe with Agent ${bundleLabel}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title='Payment method' className='pt-6'>
        {hasCustomer ? (
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-muted-foreground text-sm'>
              Cards and invoices are managed in the Stripe customer portal.
            </p>
            <Button
              type='button'
              size='sm'
              variant='outline'
              isLoading={billingPortal.isPending}
              onClick={() => billingPortal.mutate()}
            >
              Open portal
            </Button>
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>
            First month is free with no card. A card is added when you subscribe after trial.
          </p>
        )}
      </SettingsSection>
    </div>
  );
}
