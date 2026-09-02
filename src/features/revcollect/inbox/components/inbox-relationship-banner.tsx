'use client';

import { Button } from '@/components/ui/button';
import { useRecordRelationshipPolicy } from '../../api/queries';
import type { Customer } from '../../types';
import {
  expireRelationshipPolicy,
  isPaymentClaimStale,
  PAYMENT_CLAIM_VERIFY_DAYS,
  policyFromCustomer
} from '../../lib/relationship-policy';

interface InboxRelationshipBannerProps {
  customer: Customer;
  invoiceId?: string;
}

export function InboxRelationshipBanner({ customer }: InboxRelationshipBannerProps) {
  const mutation = useRecordRelationshipPolicy();
  const policy = expireRelationshipPolicy(policyFromCustomer(customer));
  const suggestion = policy.pendingSuggestion;

  if (policy.state === 'resume_review') {
    return (
      <div className='border-border bg-muted/40 mb-3 rounded-xl border px-3 py-3'>
        <p className='text-sm font-medium'>Resume review</p>
        <p className='text-muted-foreground mt-1 text-xs'>
          The pause date passed. Collections stay stopped until you resume, extend, or keep this
          paused.
        </p>
        <div className='mt-3 flex flex-wrap gap-2'>
          <Button
            type='button'
            size='sm'
            className='rounded-full'
            isLoading={mutation.isPending && mutation.variables?.action === 'resume'}
            onClick={() => mutation.mutate({ customerId: customer.id, action: 'resume' })}
          >
            Resume
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='rounded-full'
            isLoading={mutation.isPending && mutation.variables?.action === 'extend'}
            onClick={() =>
              mutation.mutate({ customerId: customer.id, action: 'extend', pauseDays: 14 })
            }
          >
            Extend 14 days
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='rounded-full'
            isLoading={mutation.isPending && mutation.variables?.action === 'keep_paused'}
            onClick={() => mutation.mutate({ customerId: customer.id, action: 'keep_paused' })}
          >
            Keep paused
          </Button>
        </div>
      </div>
    );
  }

  if (policy.state === 'payment_claimed') {
    const stale = isPaymentClaimStale(policy);
    return (
      <div className='border-border bg-muted/40 mb-3 rounded-xl border px-3 py-3'>
        <p className='text-sm font-medium'>
          {stale ? 'Still unpaid — verify' : 'Payment to reconcile'}
        </p>
        <p className='text-muted-foreground mt-1 text-xs'>
          {stale
            ? 'They said payment was sent, but it has not shown up in Xero. Ask for a reference, or keep waiting.'
            : 'Overnight chase is paused until this payment is matched in Xero.'}
        </p>
        {stale ? (
          <div className='mt-3 flex flex-wrap gap-2'>
            <Button
              type='button'
              size='sm'
              className='rounded-full'
              isLoading={mutation.isPending && mutation.variables?.action === 'resume'}
              onClick={() => mutation.mutate({ customerId: customer.id, action: 'resume' })}
            >
              Resume collections
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='rounded-full'
              isLoading={mutation.isPending && mutation.variables?.action === 'extend'}
              onClick={() =>
                mutation.mutate({
                  customerId: customer.id,
                  action: 'extend',
                  pauseDays: PAYMENT_CLAIM_VERIFY_DAYS
                })
              }
            >
              Wait {PAYMENT_CLAIM_VERIFY_DAYS} more days
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (!suggestion) return null;

  const confirmLabel =
    suggestion.reason === 'wrong_contact'
      ? suggestion.proposedEmail
        ? `Use ${suggestion.proposedEmail}`
        : 'Do not contact'
      : suggestion.reason === 'payment_claimed'
        ? 'Mark payment claimed'
        : suggestion.reason === 'dispute'
          ? 'Mark dispute'
          : `Pause ${suggestion.suggestedPauseDays} days`;

  return (
    <div className='border-border bg-muted/40 mb-3 rounded-xl border px-3 py-3'>
      <p className='text-sm font-medium'>Suggested relationship action</p>
      <blockquote className='text-muted-foreground mt-1 border-l-2 pl-2 text-xs italic'>
        “{suggestion.quote}”
      </blockquote>
      <div className='mt-3 flex flex-wrap gap-2'>
        <Button
          type='button'
          size='sm'
          className='rounded-full'
          isLoading={mutation.isPending && mutation.variables?.action === 'confirm_suggestion'}
          onClick={() => mutation.mutate({ customerId: customer.id, action: 'confirm_suggestion' })}
        >
          {confirmLabel}
        </Button>
        {suggestion.reason === 'bereavement' ||
        suggestion.reason === 'medical' ||
        suggestion.reason === 'family_emergency' ? (
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='rounded-full'
            isLoading={mutation.isPending && mutation.variables?.action === 'set_mode'}
            onClick={() =>
              mutation.mutate({
                customerId: customer.id,
                action: 'set_mode',
                pauseMode: 'manual_only',
                reason: suggestion.reason
              })
            }
          >
            Manual only
          </Button>
        ) : null}
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='rounded-full'
          isLoading={mutation.isPending && mutation.variables?.action === 'dismiss_suggestion'}
          onClick={() => mutation.mutate({ customerId: customer.id, action: 'dismiss_suggestion' })}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
