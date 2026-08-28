'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { AUTH_REQUEST_TIMEOUT_MS, TimeoutError, withTimeout } from '@/lib/auth-timeout';
import { safeNextPath } from '@/lib/auth-paths';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { toast } from 'sonner';

interface GoogleAuthButtonProps {
  label?: string;
}

function googleAuthErrorMessage(err: unknown): string {
  if (err instanceof TimeoutError) {
    return 'Sign-in timed out. Check your connection and try again.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Could not start Google sign-in.';
}

export function GoogleAuthButton({ label = 'Continue with Google' }: GoogleAuthButtonProps) {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);

    if (!hasSupabaseEnv()) {
      const message =
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
      setError(message);
      toast.error(message);
      return;
    }

    setIsPending(true);
    try {
      const next = searchParams.get('next');
      const safeNext = safeNextPath(next);
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

      const supabase = createClient();
      const { data, error: oauthError } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        }),
        AUTH_REQUEST_TIMEOUT_MS
      );

      if (oauthError) {
        setError(oauthError.message);
        toast.error(oauthError.message);
        setIsPending(false);
        return;
      }

      if (!data.url) {
        setError('Could not start Google sign-in.');
        toast.error('Could not start Google sign-in.');
        setIsPending(false);
        return;
      }

      window.location.replace(data.url);
    } catch (err) {
      const message = googleAuthErrorMessage(err);
      setError(message);
      toast.error(message);
      setIsPending(false);
    }
  }

  return (
    <div className='space-y-2'>
      <Button
        type='button'
        variant='outline'
        className='w-full'
        isLoading={isPending}
        onClick={handleGoogleSignIn}
      >
        <Icons.google className='size-4' />
        {label}
      </Button>
      {error ? <p className='text-destructive text-sm'>{error}</p> : null}
    </div>
  );
}
