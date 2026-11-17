'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const XERO_SSO_SCRIPT = 'https://edge.xero.com/platform/sso/xero-sso.js';

let xeroSsoScript: Promise<string> | null = null;

function loadXeroSsoScript(): Promise<string> {
  xeroSsoScript ??= fetch(XERO_SSO_SCRIPT).then((response) => {
    if (!response.ok) {
      throw new Error('Could not load the Xero sign-in button.');
    }
    return response.text();
  });
  return xeroSsoScript;
}

function runnableXeroSsoScript(source: string): string {
  return source.replace(
    'window.customElements.define("xero-sso",x)',
    'window.customElements.get("xero-sso")||window.customElements.define("xero-sso",x)'
  );
}

interface XeroSignInButtonProps {
  disabled?: boolean;
}

function XeroSignInButton({ disabled = false }: XeroSignInButtonProps) {
  const buttonRef = useRef<HTMLSpanElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    let cancelled = false;

    void loadXeroSsoScript()
      .then((source) => {
        if (cancelled || !buttonRef.current) return;
        buttonRef.current.replaceChildren();
        const script = document.createElement('script');
        script.text = runnableXeroSsoScript(source);
        document.body.appendChild(script);
        script.remove();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <a
        href='/api/auth/xero/start'
        className={cn(
          'text-sm font-medium underline underline-offset-4',
          disabled && 'pointer-events-none opacity-50'
        )}
        aria-disabled={disabled}
      >
        Sign in with Xero
      </a>
    );
  }

  return (
    <span
      ref={buttonRef}
      data-xero-sso
      data-href='/api/auth/xero/start'
      data-label='Sign in with Xero'
      data-size='large'
      data-height='52'
      data-theme='light'
      className={cn(disabled && 'pointer-events-none opacity-50')}
      aria-disabled={disabled}
    />
  );
}

export { XeroSignInButton };
