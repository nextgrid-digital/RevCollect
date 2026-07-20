import { Suspense } from 'react';
import { LoginForm } from '@/features/revcollect/auth/components/login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
