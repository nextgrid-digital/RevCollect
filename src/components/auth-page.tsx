'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthDivider } from '@/components/auth-divider';
import { AuthShell } from '@/components/auth-shell';
import { GoogleIcon } from '@/components/icons/google-icon';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group';
import { AUTH_REQUEST_TIMEOUT_MS, TimeoutError, withTimeout } from '@/lib/auth-timeout';
import { cn } from '@/lib/utils';
import { POST_LOGIN_PATH, safeNextPath } from '@/lib/auth-paths';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { XeroSignInButton } from '@/components/xero-sign-in-button';
import { ZohoSignInButton } from '@/components/zoho-sign-in-button';
import { toast } from 'sonner';

type AuthMode = 'signIn' | 'signUp' | 'forgot';

function initialAuthMode(view: string | null): AuthMode {
  if (view === 'forgot') return 'forgot';
  if (view === 'signUp') return 'signUp';
  return 'signIn';
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_supabase_env:
    'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.',
  auth_callback_failed: 'Could not complete sign-in. Please try again.',
  missing_xero_credentials: 'Xero sign-in is not configured.',
  missing_xero_email: 'Xero did not return an email. Check OpenID scopes on the Xero app.',
  missing_intuit_credentials: 'Intuit sign-in is not configured.',
  missing_intuit_email: 'Intuit did not return an email. Enable OpenID email on the app.',
  missing_zoho_credentials: 'Zoho sign-in is not configured.',
  missing_zoho_email: 'Zoho did not return an email for this account.'
};

function authErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof TimeoutError) {
    return 'Sign-in timed out. Check your connection and try again.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export function AuthPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() => initialAuthMode(searchParams.get('view')));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const nextPath = safeNextPath(searchParams.get('next'));
  const queryError = searchParams.get('error');
  const intuitEmailUnverified = !error && queryError === 'intuit_email_unverified';
  const displayError =
    error ??
    (queryError && !intuitEmailUnverified
      ? (ERROR_MESSAGES[queryError] ?? 'Could not sign in')
      : null);

  function goToApp(path: string) {
    setIsRedirecting(true);
    window.location.replace(path);
  }

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    let cancelled = false;
    const supabase = createClient();

    void withTimeout(supabase.auth.getSession(), AUTH_REQUEST_TIMEOUT_MS)
      .then(({ data }) => {
        if (cancelled || !data.session) return;
        setIsRedirecting(true);
        window.location.replace(nextPath);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  async function handleGoogleSignIn() {
    setError(null);
    setInfo(null);

    if (!hasSupabaseEnv()) {
      setError(ERROR_MESSAGES.missing_supabase_env);
      toast.error(ERROR_MESSAGES.missing_supabase_env);
      return;
    }

    setIsGooglePending(true);
    try {
      const supabase = createClient();
      const redirectTo = new URL('/auth/callback', window.location.origin);
      redirectTo.searchParams.set('next', nextPath);

      const { data, error: oauthError } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectTo.toString(),
            skipBrowserRedirect: true
          }
        }),
        AUTH_REQUEST_TIMEOUT_MS
      );

      if (oauthError) {
        setError(oauthError.message);
        toast.error(oauthError.message);
        setIsGooglePending(false);
        return;
      }

      if (!data.url) {
        setError('Could not start Google sign-in.');
        toast.error('Could not start Google sign-in.');
        setIsGooglePending(false);
        return;
      }

      setIsRedirecting(true);
      window.location.replace(data.url);
    } catch (err) {
      const message = authErrorMessage(err, 'Could not start Google sign-in.');
      setError(message);
      toast.error(message);
      setIsGooglePending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!hasSupabaseEnv()) {
      setError(ERROR_MESSAGES.missing_supabase_env);
      toast.error(ERROR_MESSAGES.missing_supabase_env);
      return;
    }

    if (mode === 'signUp' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsPending(true);
    try {
      const supabase = createClient();

      if (mode === 'forgot') {
        const redirectTo = new URL('/auth/callback', window.location.origin);
        redirectTo.searchParams.set('next', '/auth/reset-password');
        const { error: resetError } = await withTimeout(
          supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: redirectTo.toString()
          }),
          AUTH_REQUEST_TIMEOUT_MS
        );

        if (resetError && !/not found/i.test(resetError.message)) {
          setError(resetError.message);
          toast.error(resetError.message);
          setIsPending(false);
          return;
        }

        setInfo('Check your email for a link to reset your password.');
        toast.success('Reset link sent');
        setIsPending(false);
        return;
      }

      if (mode === 'signIn') {
        const { error: signInError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          }),
          AUTH_REQUEST_TIMEOUT_MS
        );

        if (signInError) {
          setError(signInError.message);
          toast.error(signInError.message);
          setIsPending(false);
          return;
        }

        goToApp(nextPath);
        return;
      }

      const { data, error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        }),
        AUTH_REQUEST_TIMEOUT_MS
      );

      if (signUpError) {
        setError(signUpError.message);
        toast.error(signUpError.message);
        setIsPending(false);
        return;
      }

      if (data.session) {
        goToApp(POST_LOGIN_PATH);
        return;
      }

      setInfo('Check your email to confirm your account, then sign in.');
      toast.success('Check your email to confirm your account');
      setMode('signIn');
      setIsPending(false);
    } catch (err) {
      const message = authErrorMessage(err, 'Could not authenticate. Check Supabase env vars.');
      setError(message);
      toast.error(message);
      setIsPending(false);
    }
  }

  if (isRedirecting) {
    return (
      <main className='flex min-h-svh flex-col items-center justify-center gap-3'>
        <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
        <p className='text-muted-foreground text-sm'>Signing you in…</p>
      </main>
    );
  }

  const heading =
    mode === 'forgot' ? 'Reset password' : mode === 'signIn' ? 'Sign in' : 'Create account';

  return (
    <AuthShell>
      <div className='flex flex-col gap-1'>
        <h1 className='font-[family-name:var(--font-stix-two-text)] text-4xl font-medium tracking-tight'>
          {heading}
        </h1>
      </div>

      <form className='flex flex-col gap-3' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-start text-xs'>Email</p>
          <InputGroup>
            <InputGroupInput
              placeholder='you@company.com'
              type='email'
              autoComplete='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <InputGroupAddon align='inline-start'>
              <Icons.at className='size-4' />
            </InputGroupAddon>
          </InputGroup>
        </div>

        {mode === 'forgot' ? null : (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <p className='text-muted-foreground text-start text-xs'>Password</p>
              {mode === 'signIn' ? (
                <button
                  type='button'
                  className='text-muted-foreground hover:text-foreground text-xs underline underline-offset-4'
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Forgot password?
                </button>
              ) : null}
            </div>
            <InputGroup>
              <InputGroupInput
                placeholder={mode === 'signUp' ? 'At least 6 characters' : 'Your password'}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'signUp' ? 6 : undefined}
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
        )}

        {intuitEmailUnverified ? (
          <p className='text-destructive text-sm'>
            This Intuit email is not verified.{' '}
            <a
              className='underline underline-offset-4'
              href='https://accounts.intuit.com/app/account-manager/security'
            >
              Verify it in Intuit Sign in & security
            </a>
            , then try again.
          </p>
        ) : null}
        {displayError ? <p className='text-destructive text-sm'>{displayError}</p> : null}
        {info ? <p className='text-sm text-emerald-600 dark:text-emerald-400'>{info}</p> : null}

        <Button className='w-full' type='submit' isLoading={isPending} disabled={isGooglePending}>
          {mode === 'forgot' ? 'Send reset link' : mode === 'signIn' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      {mode === 'forgot' ? null : (
        <Button
          type='button'
          className='w-full'
          variant='outline'
          isLoading={isGooglePending}
          disabled={isPending}
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon data-icon='inline-start' />
          {mode === 'signUp' ? 'Sign up with Google' : 'Continue with Google'}
        </Button>
      )}

      <p className='text-muted-foreground text-center text-sm'>
        {mode === 'signIn' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type='button'
              className='text-foreground font-medium underline underline-offset-4'
              onClick={() => {
                setMode('signUp');
                setError(null);
                setInfo(null);
              }}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            {mode === 'forgot' ? 'Remembered it? ' : 'Already have an account? '}
            <button
              type='button'
              className='text-foreground font-medium underline underline-offset-4'
              onClick={() => {
                setMode('signIn');
                setError(null);
                setInfo(null);
              }}
            >
              Sign in
            </button>
          </>
        )}
      </p>

      {mode === 'forgot' ? null : (
        <>
          <AuthDivider>OR</AuthDivider>

          <div className='flex flex-col items-center gap-2'>
            <div className='flex items-center justify-center'>
              <a
                href='/api/auth/intuit/start'
                className={cn(
                  'inline-flex',
                  (isPending || isGooglePending) && 'pointer-events-none opacity-50'
                )}
                aria-label='Sign in with Intuit'
                aria-disabled={isPending || isGooglePending}
              >
                <img
                  src='/intuit/Sign_in_blue_btn_lg.svg'
                  alt='Sign in with Intuit'
                  width={242}
                  height={52}
                  className='h-[52px] w-auto'
                />
              </a>
            </div>
            <XeroSignInButton disabled={isPending || isGooglePending} />
            <ZohoSignInButton disabled={isPending || isGooglePending} />
          </div>
        </>
      )}

      <p className='text-muted-foreground text-center text-xs whitespace-nowrap'>
        By continuing, you agree to our{' '}
        <a className='hover:text-primary underline underline-offset-4' href='/terms'>
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          className='hover:text-primary underline underline-offset-4'
          href='https://revcollect.ai/security/privacy-policy'
        >
          Privacy Policy
        </a>
        .
      </p>
    </AuthShell>
  );
}
