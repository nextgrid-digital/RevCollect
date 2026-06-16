'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WaitlistFormProps {
  className?: string;
  compact?: boolean;
  idPrefix?: string;
}

export function WaitlistForm({ className, compact = false, idPrefix = 'waitlist' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Enter your work email to join the waitlist.');
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    toast.success("You're on the list — we'll email you when your spot opens.");
    setEmail('');
    setCompany('');
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn('flex w-full max-w-md flex-col gap-2 sm:flex-row', className)}
      >
        <Input
          id={`${idPrefix}-email`}
          type='email'
          inputMode='email'
          autoComplete='email'
          placeholder='you@firm.com'
          aria-label='Work email'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className='h-11 flex-1'
          required
        />
        <Button type='submit' size='lg' className='h-11 shrink-0' isLoading={isSubmitting}>
          Join waitlist
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className='space-y-2'>
        <Label htmlFor={`${idPrefix}-email`}>Work email</Label>
        <Input
          id={`${idPrefix}-email`}
          type='email'
          inputMode='email'
          autoComplete='email'
          placeholder='you@firm.com'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor={`${idPrefix}-company`}>
          Firm or company <span className='text-muted-foreground font-normal'>(optional)</span>
        </Label>
        <Input
          id={`${idPrefix}-company`}
          type='text'
          autoComplete='organization'
          placeholder='Acme Bookkeeping'
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>
      <Button type='submit' size='lg' className='w-full sm:w-auto' isLoading={isSubmitting}>
        Join waitlist
      </Button>
      <p className='text-muted-foreground text-xs'>
        We&apos;ll only email you about RevCollect access and product updates. No spam.
      </p>
    </form>
  );
}
