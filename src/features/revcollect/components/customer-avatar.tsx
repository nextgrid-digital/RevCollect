import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CustomerAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

export function CustomerAvatar({ name, className }: CustomerAvatarProps) {
  return (
    <Avatar className={cn('size-8', className)}>
      <AvatarFallback className='bg-transparent text-muted-foreground'>
        <Icons.user className='size-1/2 shrink-0' aria-hidden />
        <span className='sr-only'>{name}</span>
      </AvatarFallback>
    </Avatar>
  );
}
