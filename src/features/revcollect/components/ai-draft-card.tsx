'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AiDraftCardProps {
  draft: string;
  compact?: boolean;
}

export function AiDraftCard({ draft, compact = false }: AiDraftCardProps) {
  const [body, setBody] = useState(draft);

  useEffect(() => {
    setBody(draft);
  }, [draft]);

  if (compact) {
    return (
      <div className='flex min-h-0 flex-col gap-2'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <span className='flex items-center gap-1.5 text-xs font-medium'>
            <Icons.sparkles className='text-primary size-3.5' />
            AI draft reply
          </span>
          <div className='flex flex-wrap gap-1.5'>
            <Button
              size='sm'
              className='h-7 px-2.5 text-xs'
              onClick={() => toast.success('Reply sent (mock)')}
            >
              <Icons.send className='size-3.5' />
              Send
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='h-7 px-2.5 text-xs'
              onClick={() => toast.message('Saved for review (mock)')}
            >
              Approve
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='h-7 px-2.5 text-xs'
              onClick={() => setBody(draft)}
            >
              Reset
            </Button>
          </div>
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          className='bg-background max-h-20 min-h-[2.75rem] resize-none overflow-y-auto text-sm'
        />
      </div>
    );
  }

  return (
    <Card className='border-primary/20 bg-primary/5 py-6 shadow-sm'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
          <Icons.sparkles className='text-primary size-4' />
          AI draft reply
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className='bg-background min-h-[160px] resize-none'
        />
      </CardContent>
      <CardFooter className='flex flex-wrap gap-2 sm:flex-nowrap'>
        <Button size='sm' onClick={() => toast.success('Reply sent (mock)')}>
          <Icons.send className='mr-1 size-4' />
          Send
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={() => toast.message('Saved for review (mock)')}
        >
          Approve
        </Button>
        <Button size='sm' variant='ghost' onClick={() => setBody(draft)}>
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}
