import { Metadata } from 'next';
import { WaitlistView } from '@/features/revcollect/marketing/components/waitlist-view';

export const metadata: Metadata = {
  title: 'Join waitlist',
  description: 'Request early access to RevCollect for your bookkeeping or finance team.'
};

export default function WaitlistPage() {
  return <WaitlistView />;
}
