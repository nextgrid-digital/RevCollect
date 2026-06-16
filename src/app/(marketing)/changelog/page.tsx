import { Metadata } from 'next';
import { ChangelogView } from '@/features/revcollect/marketing/components/changelog-view';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Product updates and release notes for RevCollect.'
};

export default function ChangelogPage() {
  return <ChangelogView />;
}
