'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { toast } from 'sonner';

interface GoogleAuthButtonProps {
  label?: string;
}

export function GoogleAuthButton({ label = 'Continue with Google' }: GoogleAuthButtonProps) {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGoogleSignIn() {
    setError(null);

    if (!hasSupabaseEnv()) {
      const message =
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
      setError(message);
      toast.error(message);
      return;
    }

    startTransition(async () => {
      try {
        const next = searchParams.get('next');
        const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/inbox';
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

        const supabase = createClient();
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });

        if (oauthError) {
          setError(oauthError.message);
          toast.error(oauthError.message);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not start Google sign-in.';
        setError(message);
        toast.error(message);
      }
    });
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
