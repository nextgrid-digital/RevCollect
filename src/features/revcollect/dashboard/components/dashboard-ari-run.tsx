import { Icons } from '@/components/icons';

interface DashboardAriRunProps {
  hourLabel: string;
  bullets: string[];
}

export function DashboardAriRun({ hourLabel, bullets }: DashboardAriRunProps) {
  if (bullets.length === 0) return null;

  return (
    <div className='rounded-xl bg-violet-500/8 px-4 py-4 dark:bg-violet-500/15'>
      <div className='mb-3 flex items-center gap-2'>
        <span className='bg-violet-600/15 text-violet-800 dark:text-violet-200 inline-flex size-7 items-center justify-center rounded-full'>
          <Icons.agent className='size-4' />
        </span>
        <div>
          <p className='text-sm font-semibold'>Overnight run — {hourLabel}</p>
          <p className='text-muted-foreground text-xs'>ARI</p>
        </div>
      </div>
      <ul className='space-y-1.5 text-sm leading-relaxed'>
        {bullets.map((bullet) => (
          <li key={bullet} className='flex gap-2'>
            <span className='mt-2 size-1 shrink-0 rounded-full bg-violet-500' />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
