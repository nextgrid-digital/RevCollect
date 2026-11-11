'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Icons } from '@/components/icons';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { cn } from '@/lib/utils';
import { formatCurrencyWhole } from '../../utils';
import type { DashboardActivityItem, DashboardPromiseRow } from '../lib/build-dashboard-snapshot';

interface DashboardActivityProps {
  ariHourLabel: string;
  ariBullets: string[];
  activity: DashboardActivityItem[];
  promises: DashboardPromiseRow[];
  onOpenThread: (messageId: string) => void;
}

const STAGGER_INITIAL_MS = 500;
const STAGGER_STEP_MS = 700;

export function DashboardActivity({
  ariHourLabel,
  ariBullets,
  activity,
  promises,
  onOpenThread
}: DashboardActivityProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const runKey = useMemo(
    () => [...ariBullets, ...activity.map((item) => item.customerId)].join('|'),
    [ariBullets, activity]
  );
  const [visibleBulletCount, setVisibleBulletCount] = useState(
    reduceMotion ? ariBullets.length : 0
  );
  const [visibleQueueCount, setVisibleQueueCount] = useState(reduceMotion ? activity.length : 0);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleBulletCount(ariBullets.length);
      setVisibleQueueCount(activity.length);
      return;
    }

    setVisibleBulletCount(0);
    setVisibleQueueCount(0);
    const timers: number[] = [];
    const bulletCount = ariBullets.length;
    const queueCount = activity.length;

    for (let index = 0; index < bulletCount; index += 1) {
      timers.push(
        window.setTimeout(
          () => setVisibleBulletCount(index + 1),
          STAGGER_INITIAL_MS + index * STAGGER_STEP_MS
        )
      );
    }

    const queuePhaseStart =
      bulletCount === 0 ? 0 : STAGGER_INITIAL_MS + (bulletCount - 1) * STAGGER_STEP_MS;
    for (let index = 0; index < queueCount; index += 1) {
      timers.push(
        window.setTimeout(
          () => setVisibleQueueCount(index + 1),
          queuePhaseStart + STAGGER_INITIAL_MS + index * STAGGER_STEP_MS
        )
      );
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [reduceMotion, ariBullets.length, activity.length, runKey]);

  if (ariBullets.length === 0 && activity.length === 0 && promises.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col gap-3'>
      {ariBullets.length > 0 ? (
        <section className='space-y-3 rounded-xl bg-violet-500/10 p-3 dark:bg-violet-500/15'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-medium text-violet-800 dark:text-violet-200'>
              <span
                className='mr-1.5 size-1.5 rounded-full bg-violet-600 dark:bg-violet-300'
                aria-hidden
              />
              RevCollect
            </span>
            <p className='text-sm font-semibold tracking-tight'>Overnight run · {ariHourLabel}</p>
          </div>
          <ul className='space-y-2' aria-live='polite'>
            {ariBullets.slice(0, visibleBulletCount).map((bullet) => (
              <li key={bullet} className='flex gap-2 text-sm leading-snug'>
                <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-500' aria-hidden />
                <span className='text-foreground/90 min-w-0'>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activity.length > 0 || promises.length > 0 ? (
        <WorkspaceCard className='space-y-3 p-4 md:p-5'>
          {activity.length > 0 ? (
            <div className='space-y-1'>
              {activity.slice(0, visibleQueueCount).map((item) => {
                const messageId = item.inboxMessageId;
                const row = (
                  <>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm leading-snug font-medium'>{item.company}</p>
                      <p className='text-muted-foreground mt-0.5 text-xs leading-snug'>
                        {item.summary}
                      </p>
                    </div>
                    {messageId ? (
                      <Icons.arrowUpRight
                        className='text-muted-foreground mt-0.5 size-4 shrink-0'
                        aria-hidden
                      />
                    ) : null}
                  </>
                );
                if (!messageId) {
                  return (
                    <div
                      key={item.customerId}
                      className='flex items-start gap-2 rounded-lg px-3 py-2.5'
                    >
                      {row}
                    </div>
                  );
                }
                return (
                  <button
                    key={item.customerId}
                    type='button'
                    className='hover:bg-muted/40 focus-visible:ring-ring flex w-full cursor-pointer items-start gap-2 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none'
                    aria-label={`Open ${item.company} thread`}
                    onClick={() => onOpenThread(messageId)}
                  >
                    {row}
                  </button>
                );
              })}
            </div>
          ) : null}

          {promises.length > 0 ? (
            <section className='border-border/60 rounded-xl border'>
              <h3 className='border-border/60 border-b px-3 py-2.5 text-sm font-semibold'>
                Promises RevCollect is tracking
              </h3>
              <ul className='divide-border divide-y'>
                {promises.map((row) => {
                  const canOpen = Boolean(row.inboxMessageId);
                  const detail = [formatCurrencyWhole(row.amountCents), row.note]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li key={row.customerId}>
                      <button
                        type='button'
                        className={cn(
                          'flex w-full gap-3 px-3 py-2.5 text-left',
                          canOpen && 'hover:bg-muted/40 cursor-pointer'
                        )}
                        disabled={!canOpen}
                        onClick={() => {
                          if (row.inboxMessageId) onOpenThread(row.inboxMessageId);
                        }}
                      >
                        <span
                          className={cn(
                            'w-14 shrink-0 text-xs font-medium tabular-nums',
                            row.dueLabel === 'Today'
                              ? 'text-red-800 dark:text-red-400'
                              : 'text-muted-foreground'
                          )}
                        >
                          {row.dueLabel}
                        </span>
                        <p className='min-w-0 text-xs leading-snug'>
                          <span className='font-semibold'>{row.company}</span>
                          <span className='text-muted-foreground'> · {detail}</span>
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </WorkspaceCard>
      ) : null}
    </div>
  );
}
