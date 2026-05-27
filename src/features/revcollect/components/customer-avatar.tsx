import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getInitials } from '../utils';

interface CustomerAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

export function CustomerAvatar({ name, avatarUrl, className }: CustomerAvatarProps) {
  return (
    <Avatar className={cn('size-8', className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className='text-xs font-medium'>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
