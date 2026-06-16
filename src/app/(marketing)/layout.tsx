import { MarketingPageShell } from '@/features/revcollect/marketing/components/marketing-page-shell';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingPageShell>{children}</MarketingPageShell>;
}
