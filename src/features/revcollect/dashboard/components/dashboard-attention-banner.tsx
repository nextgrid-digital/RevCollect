import type { DashboardAttentionCard } from '../lib/build-dashboard-snapshot';

interface DashboardAttentionBannerProps {
  banner: string | null;
  cards: DashboardAttentionCard[];
}

export function DashboardAttentionBanner({ banner, cards }: DashboardAttentionBannerProps) {
  if (!banner || cards.length === 0) return null;

  return (
    <div className='rounded-xl bg-violet-500/8 px-4 py-3 text-sm leading-relaxed text-violet-950 dark:bg-violet-500/15 dark:text-violet-100'>
      {banner}.
    </div>
  );
}
