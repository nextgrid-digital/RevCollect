'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { toast } from 'sonner';

const ERROR_MESSAGES: Record<string, string> = {
  missing_supabase_env:
    'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.',
  auth_callback_failed: 'Could not complete sign-in. Please try again.'
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const queryError = searchParams.get('error');
  const displayError =
    error ?? (queryError ? (ERROR_MESSAGES[queryError] ?? 'Could not sign in') : null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!hasSupabaseEnv()) {
      setError(ERROR_MESSAGES.missing_supabase_env);
      toast.error(ERROR_MESSAGES.missing_supabase_env);
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (signInError) {
          setError(signInError.message);
          toast.error(signInError.message);
          return;
        }

        toast.success('Signed in');
        const next = searchParams.get('next');
        const destination =
          next && next.startsWith('/') && !next.startsWith('//') ? next : '/inbox';
        router.replace(destination);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not sign in. Check Supabase env vars.';
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className='w-full max-w-sm space-y-6'>
      <div className='space-y-2 text-center'>
        <div className='bg-primary text-primary-foreground mx-auto flex size-10 items-center justify-center rounded-lg'>
          <Icons.logo className='size-5' />
        </div>
        <h1 className='text-2xl font-semibold tracking-tight'>Sign in to RevCollect</h1>
        <p className='text-muted-foreground text-sm'>
          Use your Supabase account email and password
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            autoComplete='username'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            type='password'
            autoComplete='current-password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {displayError ? <p className='text-destructive text-sm'>{displayError}</p> : null}

        <Button type='submit' className='w-full' isLoading={isPending}>
          Sign in
        </Button>
      </form>

      <p className='text-muted-foreground text-center text-sm'>
        No account?{' '}
        <Link
          href='/signup'
          className='text-foreground font-medium underline-offset-4 hover:underline'
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
