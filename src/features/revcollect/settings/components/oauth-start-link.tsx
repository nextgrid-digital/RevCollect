'use client';

import type { ReactNode } from 'react';

interface OAuthStartLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function OAuthStartLink({ href, children, className }: OAuthStartLinkProps) {
  return (
    <a href={href} target='_blank' rel='noopener noreferrer' className={className}>
      {children}
    </a>
  );
}

export function openOAuthStart(path: string): void {
  window.open(path, '_blank', 'noopener,noreferrer');
}
