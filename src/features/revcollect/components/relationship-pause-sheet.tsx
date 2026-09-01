'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { useAgentConfig, useRecordRelationshipPolicy } from '../api/queries';
import type {
  Customer,
  RelationshipPauseMode,
  RelationshipReason,
  RelationshipScope
} from '../types';
import { addDaysIsoDate } from '../lib/collection-decision';

const REASONS: { id: RelationshipReason; label: string }[] = [
  { id: 'bereavement', label: 'Bereavement' },
  { id: 'medical', label: 'Medical' },
  { id: 'family_emergency', label: 'Family emergency' },
  { id: 'cash_flow', label: 'Cash flow' },
  { id: 'dispute', label: 'Dispute' },
  { id: 'vip_customer', label: 'VIP customer' },
  { id: 'manual', label: 'Manual' }
];

const DURATIONS = [
  { id: '7', label: '7 days' },
  { id: '14', label: '14 days' },
  { id: '30', label: '30 days' },
  { id: 'custom', label: 'Custom date' },
  { id: 'until', label: 'Until I resume' }
];

const MODES: { id: RelationshipPauseMode; label: string }[] = [
  { id: 'no_follow_ups', label: 'No follow-ups' },
  { id: 'manual_only', label: 'Manual only' },
  { id: 'founder_only', label: 'Founder only' }
];

interface RelationshipPauseSheetProps {
  customer: Customer;
  invoiceId?: string;
  triggerLabel?: string;
  className?: string;
}

export function RelationshipPauseSheet({
  customer,
  invoiceId,
  triggerLabel = 'Pause',
  className
}: RelationshipPauseSheetProps) {
  const mutation = useRecordRelationshipPolicy();
  const { data: agentConfig } = useAgentConfig();
  const defaultDays = String(agentConfig?.behaviors.defaultPauseDays ?? 14);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<RelationshipReason>('manual');
  const [scope, setScope] = useState<RelationshipScope>('customer');
  const [duration, setDuration] = useState(defaultDays);
  const [customDate, setCustomDate] = useState(addDaysIsoDate(14));
  const [pauseMode, setPauseMode] = useState<RelationshipPauseMode>('no_follow_ups');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className={className ?? 'rounded-full'}
          aria-label='Pause follow-ups'
        >
          <Icons.pause className='size-3.5' />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pause collections</DialogTitle>
          <DialogDescription>
            Stops overnight drafts for {customer.company} until you resume or the date passes.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-2'>
          <div className='grid gap-2'>
            <Label htmlFor='pause-reason'>Reason</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as RelationshipReason)}
            >
              <SelectTrigger id='pause-reason' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='pause-scope'>Scope</Label>
            <Select value={scope} onValueChange={(value) => setScope(value as RelationshipScope)}>
              <SelectTrigger id='pause-scope' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='customer'>Whole customer</SelectItem>
                <SelectItem value='invoice' disabled={!invoiceId}>
                  This invoice
                </SelectItem>
                <SelectItem value='contact'>This contact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='pause-duration'>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id='pause-duration' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {duration === 'custom' ? (
              <input
                type='date'
                value={customDate}
                onChange={(event) => setCustomDate(event.target.value)}
                className='border-input bg-background h-9 rounded-md border px-3 text-sm'
                aria-label='Pause until date'
              />
            ) : null}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='pause-mode'>While paused</Label>
            <Select
              value={pauseMode}
              onValueChange={(value) => setPauseMode(value as RelationshipPauseMode)}
            >
              <SelectTrigger id='pause-mode' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            isLoading={mutation.isPending}
            onClick={() => {
              mutation.mutate(
                {
                  customerId: customer.id,
                  action: 'pause',
                  reason,
                  scope,
                  invoiceId: scope === 'invoice' ? invoiceId : undefined,
                  contactEmail: scope === 'contact' ? customer.email : undefined,
                  pauseDays:
                    duration === '7' || duration === '14' || duration === '30'
                      ? Number(duration)
                      : undefined,
                  pauseUntil: duration === 'custom' ? customDate : undefined,
                  pauseMode
                },
                { onSuccess: () => setOpen(false) }
              );
            }}
          >
            Confirm pause
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
