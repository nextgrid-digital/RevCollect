import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { PlaygroundPage } from '@/features/revcollect/playground/components/playground-page';
import { isPlaygroundEnabled } from '@/lib/playground-enabled';

export default function PlaygroundRoute() {
  if (!isPlaygroundEnabled()) notFound();
  return (
    <PageContainer lockPageScroll flushTop flushX>
      <PlaygroundPage />
    </PageContainer>
  );
}
