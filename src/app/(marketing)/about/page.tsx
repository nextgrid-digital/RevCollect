import { Metadata } from 'next';
import { AboutView } from '@/features/revcollect/marketing/components/about-view';

export const metadata: Metadata = {
  title: 'About',
  description: 'RevCollect is AI-powered accounts receivable software for bookkeepers and finance teams.'
};

export default function AboutPage() {
  return <AboutView />;
}
