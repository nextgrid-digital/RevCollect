import { Metadata } from 'next';
import { LandingView } from '@/features/revcollect/marketing/components/landing-view';

export const metadata: Metadata = {
  title: 'RevCollect — AI-powered accounts receivable collections',
  description:
    'Collect faster with an AI-assisted inbox, aging reports, and customer context. Built for bookkeepers and finance teams.',
  openGraph: {
    title: 'RevCollect',
    description: 'AI-powered accounts receivable and collections workflow.',
    type: 'website'
  }
};

export default function HomePage() {
  return <LandingView />;
}
