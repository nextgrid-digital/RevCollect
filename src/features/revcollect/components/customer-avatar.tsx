import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CustomerAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function CustomerAvatar({ name, avatarUrl, className }: CustomerAvatarProps) {
  return (
    <Avatar className={cn('size-8', className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className='text-xs font-medium'>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
