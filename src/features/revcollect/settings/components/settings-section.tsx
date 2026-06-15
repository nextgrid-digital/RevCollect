import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: ReactNode;
  leading?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  leading,
  action,
  children,
  className
}: SettingsSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h2 className='flex items-center gap-2 text-base font-semibold'>
            {leading}
            {title}
          </h2>
          {description ? (
            <div className='text-muted-foreground mt-1 text-sm'>{description}</div>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
