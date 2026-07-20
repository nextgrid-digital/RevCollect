import { Suspense } from 'react';
import { SignupForm } from '@/features/revcollect/auth/components/signup-form';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
