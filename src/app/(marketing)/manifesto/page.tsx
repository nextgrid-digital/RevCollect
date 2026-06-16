import { Metadata } from 'next';
import { ManifestoView } from '@/features/revcollect/marketing/components/manifesto-view';

export const metadata: Metadata = {
  title: 'Manifesto',
  description: 'Why we built RevCollect — control your receivables without chaos.'
};

export default function ManifestoPage() {
  return <ManifestoView />;
}
