'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group';
import { AUTH_REQUEST_TIMEOUT_MS, TimeoutError, withTimeout } from '@/lib/auth-timeout';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/supabase/env';

type SessionState = 'loading' | 'ready' | 'missing';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setSessionState('missing');
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    void withTimeout(supabase.auth.getSession(), AUTH_REQUEST_TIMEOUT_MS)
      .then(({ data }) => {
        if (cancelled) return;
        setSessionState(data.session ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setSessionState('missing');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsPending(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password }),
        AUTH_REQUEST_TIMEOUT_MS
      );

      if (updateError) {
        setError(updateError.message);
        setIsPending(false);
        return;
      }

      window.location.replace(POST_LOGIN_PATH);
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? 'Saving the password timed out. Try again.'
          : err instanceof Error
            ? err.message
            : 'Could not update the password.'
      );
      setIsPending(false);
    }
  }

  if (sessionState === 'loading') {
    return (
      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
        <Icons.spinner className='size-4 animate-spin' />
        Checking your reset link…
      </div>
    );
  }

  if (sessionState === 'missing') {
    return (
      <div className='space-y-4'>
        <h1 className='font-[family-name:var(--font-stix-two-text)] text-4xl font-medium tracking-tight'>
          Reset password
        </h1>
        <p className='text-muted-foreground text-sm'>This reset link is invalid or has expired.</p>
        <a
          className='text-foreground text-sm font-medium underline underline-offset-4'
          href='/?view=forgot'
        >
          Request a new link
        </a>
      </div>
    );
  }

  return (
    <>
      <h1 className='font-[family-name:var(--font-stix-two-text)] text-4xl font-medium tracking-tight'>
        Choose a new password
      </h1>
      <form className='flex flex-col gap-3' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-start text-xs'>New password</p>
          <InputGroup>
            <InputGroupInput
              placeholder='At least 6 characters'
              type={showPassword ? 'text' : 'password'}
              autoComplete='new-password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
            <InputGroupAddon align='inline-start'>
              <Icons.lock className='size-4' />
            </InputGroupAddon>
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-xs'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <Icons.eyeOff /> : <Icons.eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-start text-xs'>Confirm password</p>
          <InputGroup>
            <InputGroupInput
              placeholder='Repeat the password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='new-password'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
            />
            <InputGroupAddon align='inline-start'>
              <Icons.lock className='size-4' />
            </InputGroupAddon>
          </InputGroup>
        </div>
        {error ? <p className='text-destructive text-sm'>{error}</p> : null}
        <Button className='w-full' type='submit' isLoading={isPending}>
          Update password
        </Button>
      </form>
    </>
  );
}
