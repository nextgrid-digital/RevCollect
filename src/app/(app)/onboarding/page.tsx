import PageContainer from '@/components/layout/page-container';
import { OnboardingSteps } from '@/features/revcollect/onboarding/components/onboarding-steps';

export default function OnboardingPage() {
  return (
    <PageContainer
      pageTitle='Onboarding'
      pageDescription='Get RevCollect ready to collect.'
    >
      <OnboardingSteps />
    </PageContainer>
  );
}
