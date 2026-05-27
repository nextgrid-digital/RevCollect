'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AiDraftCardProps {
  draft: string;
}

export function AiDraftCard({ draft }: AiDraftCardProps) {
  const [body, setBody] = useState(draft);

  return (
    <Card className='border-primary/20 bg-primary/5'>
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
          className='min-h-[160px] resize-none bg-background'
        />
      </CardContent>
      <CardFooter className='flex flex-wrap gap-2 sm:flex-nowrap'>
        <Button
          size='sm'
          onClick={() => toast.success('Reply sent (mock)')}
        >
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
