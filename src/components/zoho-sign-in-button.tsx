'use client';

import { cn } from '@/lib/utils';

interface ZohoSignInButtonProps {
  disabled?: boolean;
}

function ZohoSignInButton({ disabled = false }: ZohoSignInButtonProps) {
  return (
    <a
      href='/api/auth/zoho/start'
      aria-label='Sign in with Zoho'
      aria-disabled={disabled}
      className={cn(
        'inline-flex h-[52px] items-center gap-2 rounded border border-[#ccced2] bg-white px-4 text-[15px] font-bold text-[#404756] shadow-[0_1px_2px_#e6e7e9]',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <img src='/zoho/zoho-logo.svg' alt='' width={50} height={22} className='h-[22px] w-auto' />
      Sign in with Zoho
    </a>
  );
}

export { ZohoSignInButton };
