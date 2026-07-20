'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { toast } from 'sonner';

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!hasSupabaseEnv()) {
      const message =
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.';
      setError(message);
      toast.error(message);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          toast.error(signUpError.message);
          return;
        }

        if (data.session) {
          toast.success('Account created');
          router.replace('/inbox');
          router.refresh();
          return;
        }

        setInfo('Check your email to confirm your account, then sign in.');
        toast.success('Check your email to confirm your account');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not sign up. Check Supabase env vars.';
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
        <h1 className='text-2xl font-semibold tracking-tight'>Create your account</h1>
        <p className='text-muted-foreground text-sm'>
          Sign up with email and password via Supabase
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            autoComplete='email'
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
            autoComplete='new-password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error ? <p className='text-destructive text-sm'>{error}</p> : null}
        {info ? <p className='text-sm text-emerald-600 dark:text-emerald-400'>{info}</p> : null}

        <Button type='submit' className='w-full' isLoading={isPending}>
          Sign up
        </Button>
      </form>

      <p className='text-muted-foreground text-center text-sm'>
        Already have an account?{' '}
        <Link
          href='/login'
          className='text-foreground font-medium underline-offset-4 hover:underline'
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
