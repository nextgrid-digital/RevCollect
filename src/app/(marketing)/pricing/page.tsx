import { Metadata } from 'next';
import { PricingView } from '@/features/revcollect/marketing/components/pricing-view';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'RevCollect pricing — join the waitlist for free early access during private beta.'
};

export default function PricingPage() {
  return <PricingView />;
}
