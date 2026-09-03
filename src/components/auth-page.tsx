'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthDivider } from '@/components/auth-divider';
import { FloatingPaths } from '@/components/floating-paths';
import { GoogleIcon } from '@/components/icons/google-icon';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { AUTH_REQUEST_TIMEOUT_MS, TimeoutError, withTimeout } from '@/lib/auth-timeout';
import { cn } from '@/lib/utils';
import { POST_LOGIN_PATH, safeNextPath } from '@/lib/auth-paths';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { toast } from 'sonner';

type AuthMode = 'signIn' | 'signUp';

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

function RevCollectMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icons.logo className='size-8 shrink-0' />
      <span className='text-sm font-semibold tracking-tight'>RevCollect</span>
    </div>
  );
}

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
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const nextPath = safeNextPath(searchParams.get('next'));
  const queryError = searchParams.get('error');
  const displayError =
    error ?? (queryError ? (ERROR_MESSAGES[queryError] ?? 'Could not sign in') : null);

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

  return (
    <main className='relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2'>
      <div className='bg-secondary relative hidden h-full flex-col border-r p-10 lg:flex dark:bg-secondary/20'>
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background' />
        <RevCollectMark className='relative z-10 mr-auto' />

        <div className='z-10 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-xl'>
              &ldquo;RevCollect cut our follow-up time in half — overdue invoices and customer
              context live in one inbox.&rdquo;
            </p>
            <footer className='font-mono text-sm font-semibold'>~ Finance lead</footer>
          </blockquote>
        </div>
        <div className='absolute inset-0'>
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className='relative flex min-h-screen flex-col justify-center px-8'>
        <div aria-hidden className='absolute inset-0 -z-10 opacity-60 contain-strict isolate'>
          <div className='absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]' />
          <div className='absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]' />
          <div className='absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]' />
        </div>

        <div className='mx-auto w-full space-y-4 sm:w-sm'>
          <RevCollectMark className='lg:hidden' />
          <div className='flex flex-col gap-1'>
            <h1 className='text-2xl font-bold tracking-wide'>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </h1>
            <p className='text-muted-foreground text-base'>
              {mode === 'signIn'
                ? 'Sign in to your RevCollect workspace.'
                : 'Create your RevCollect account with email and password.'}
            </p>
          </div>

          <div className='bg-muted grid grid-cols-2 gap-1 rounded-lg p-1'>
            <Button
              type='button'
              variant={mode === 'signIn' ? 'default' : 'ghost'}
              size='sm'
              className='w-full'
              onClick={() => {
                setMode('signIn');
                setError(null);
                setInfo(null);
              }}
            >
              Sign in
            </Button>
            <Button
              type='button'
              variant={mode === 'signUp' ? 'default' : 'ghost'}
              size='sm'
              className='w-full'
              onClick={() => {
                setMode('signUp');
                setError(null);
                setInfo(null);
              }}
            >
              Sign up
            </Button>
          </div>

          <Button
            type='button'
            className='w-full'
            variant='outline'
            isLoading={isGooglePending}
            disabled={isPending}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon data-icon='inline-start' />
            Continue with Google
          </Button>
          <Button
            type='button'
            className='w-full'
            variant='outline'
            disabled={isPending || isGooglePending}
            onClick={() => {
              window.location.assign('/api/auth/xero/start');
            }}
          >
            Continue with Xero
          </Button>
          <Button
            type='button'
            className='w-full'
            variant='outline'
            disabled={isPending || isGooglePending}
            onClick={() => {
              window.location.assign('/api/auth/intuit/start');
            }}
          >
            Sign in with Intuit
          </Button>
          <Button
            type='button'
            className='w-full'
            variant='outline'
            disabled={isPending || isGooglePending}
            onClick={() => {
              window.location.assign('/api/auth/zoho/start');
            }}
          >
            Continue with Zoho
          </Button>

          <AuthDivider>OR</AuthDivider>

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

            <div className='flex flex-col gap-2'>
              <p className='text-muted-foreground text-start text-xs'>Password</p>
              <InputGroup>
                <InputGroupInput
                  placeholder={mode === 'signUp' ? 'At least 6 characters' : 'Your password'}
                  type='password'
                  autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'signUp' ? 6 : undefined}
                />
                <InputGroupAddon align='inline-start'>
                  <Icons.lock className='size-4' />
                </InputGroupAddon>
              </InputGroup>
            </div>

            {displayError ? <p className='text-destructive text-sm'>{displayError}</p> : null}
            {info ? <p className='text-sm text-emerald-600 dark:text-emerald-400'>{info}</p> : null}

            <Button
              className='w-full'
              type='submit'
              isLoading={isPending}
              disabled={isGooglePending}
            >
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className='text-muted-foreground mt-4 text-sm'>
            By continuing, you agree to our{' '}
            <a className='hover:text-primary underline underline-offset-4' href='/terms'>
              Terms of Service
            </a>{' '}
            and{' '}
            <a className='hover:text-primary underline underline-offset-4' href='/privacy'>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
