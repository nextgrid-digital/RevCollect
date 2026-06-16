import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsCard({ title, description, children, className }: SettingsCardProps) {
  return (
    <section className={cn('bg-card space-y-4 rounded-xl border p-4 md:p-5', className)}>
      <div>
        <h2 className='text-base font-semibold'>{title}</h2>
        {description ? <p className='text-muted-foreground mt-1 text-sm'>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
