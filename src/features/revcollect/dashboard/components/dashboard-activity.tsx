'use client';

import { Icons } from '@/components/icons';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { cn } from '@/lib/utils';
import { formatCurrencyWhole } from '../../utils';
import type { DashboardActivityItem, DashboardPromiseRow } from '../lib/build-dashboard-snapshot';
import { DashboardAriRun } from './dashboard-ari-run';

interface DashboardActivityProps {
  ariHourLabel: string;
  ariBullets: string[];
  activity: DashboardActivityItem[];
  promises: DashboardPromiseRow[];
  onOpenThread: (messageId: string) => void;
}

export function DashboardActivity({
  ariHourLabel,
  ariBullets,
  activity,
  promises,
  onOpenThread
}: DashboardActivityProps) {
  if (ariBullets.length === 0 && activity.length === 0 && promises.length === 0) {
    return null;
  }

  return (
    <WorkspaceCard className='space-y-5 p-4 md:p-5'>
      <DashboardAriRun hourLabel={ariHourLabel} bullets={ariBullets} />

      {activity.length > 0 ? (
        <ul className='space-y-3'>
          {activity.map((item) => {
            const canOpen = Boolean(item.inboxMessageId);

            return (
              <li key={item.customerId}>
                <button
                  type='button'
                  aria-label={
                    canOpen ? `Open ${item.company} thread` : `${item.company} has no inbox thread`
                  }
                  aria-disabled={!canOpen}
                  className={cn(
                    'flex w-full appearance-none items-start justify-between gap-3 border-0 bg-transparent p-0 text-left',
                    canOpen ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                  )}
                  onClick={() => {
                    if (item.inboxMessageId) onOpenThread(item.inboxMessageId);
                  }}
                >
                  <div className='min-w-0'>
                    <p className='text-sm font-medium'>{item.company}</p>
                    <p className='text-muted-foreground line-clamp-2 text-sm'>{item.summary}</p>
                  </div>
                  <Icons.chevronRight className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {promises.length > 0 ? (
        <div>
          <p className='mb-2 text-sm font-semibold'>Promises ARI is tracking</p>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <tbody>
                {promises.map((row) => {
                  const canOpen = Boolean(row.inboxMessageId);

                  return (
                    <tr
                      key={row.customerId}
                      className={cn(
                        'border-border/60 border-t first:border-t-0',
                        canOpen && 'hover:bg-muted/40 cursor-pointer'
                      )}
                      tabIndex={canOpen ? 0 : undefined}
                      role={canOpen ? 'button' : undefined}
                      aria-label={canOpen ? `Open ${row.company} thread` : undefined}
                      onClick={() => {
                        if (row.inboxMessageId) onOpenThread(row.inboxMessageId);
                      }}
                      onKeyDown={(event) => {
                        if (!row.inboxMessageId) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onOpenThread(row.inboxMessageId);
                        }
                      }}
                    >
                      <td className='text-muted-foreground py-2 pr-3 whitespace-nowrap'>
                        {row.dueLabel}
                      </td>
                      <td className='py-2 pr-3 font-medium'>{row.company}</td>
                      <td className='py-2 pr-3 text-right tabular-nums'>
                        {formatCurrencyWhole(row.amountCents)}
                      </td>
                      <td className='text-muted-foreground py-2 text-xs'>{row.note ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </WorkspaceCard>
  );
}
