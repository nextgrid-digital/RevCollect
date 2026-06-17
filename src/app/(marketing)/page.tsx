import { Metadata } from 'next';
import { LandingView } from '@/features/revcollect/marketing/components/landing-view';

export const metadata: Metadata = {
  title: 'RevCollect — Context-rich accounts receivable collections',
  description:
    'Context-rich collections workflow for finance teams. Review invoices and customer context, generate AI drafts on demand, and optionally enable a proactive agent that prepares work for your approval.',
  openGraph: {
    title: 'RevCollect',
    description:
      'Context-rich accounts receivable workflow with optional proactive agent — human approval on every send.',
    type: 'website'
  }
};

export default function HomePage() {
  return <LandingView />;
}
