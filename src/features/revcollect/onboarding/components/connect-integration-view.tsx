'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ConnectIntegrationViewProps {
  title: string;
  description: string;
  provider: 'QuickBooks' | 'Gmail';
}

export function ConnectIntegrationView({
  title,
  description,
  provider
}: ConnectIntegrationViewProps) {
  const [connected, setConnected] = useState(false);

  return (
    <Card className='max-w-lg'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {connected ? (
          <p className='text-sm text-emerald-600 dark:text-emerald-400'>
            {provider} connected successfully (mock).
          </p>
        ) : (
          <p className='text-muted-foreground text-sm'>
            OAuth flow will be implemented with Supabase and your provider credentials.
          </p>
        )}
        <div className='flex flex-wrap gap-2'>
          {!connected ? (
            <Button
              onClick={() => {
                setConnected(true);
                toast.success(`${provider} connected (mock)`);
              }}
            >
              Connect {provider}
            </Button>
          ) : null}
          <Button asChild variant='outline'>
            <Link href='/onboarding'>Back to onboarding</Link>
          </Button>
          {connected ? (
            <Button asChild>
              <Link href='/inbox'>Go to inbox</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
