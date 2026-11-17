import { Suspense } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { ResetPasswordForm } from '@/components/reset-password-form';
import { publicMetadata } from '@/lib/site';

export const metadata = publicMetadata({
  title: 'Reset password',
  description: 'Choose a new password for your RevCollect account.',
  path: '/auth/reset-password'
});

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
