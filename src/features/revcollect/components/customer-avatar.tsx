'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { springSoft } from '@/features/revcollect/motion/motion-tokens';

interface CustomerAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

export function CustomerAvatar({ name, className }: CustomerAvatarProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springSoft}
    >
      <Avatar className={cn('size-8', className)}>
        <AvatarFallback className='bg-transparent text-muted-foreground'>
          <Icons.user className='size-1/2 shrink-0' aria-hidden />
          <span className='sr-only'>{name}</span>
        </AvatarFallback>
      </Avatar>
    </motion.div>
  );
}
