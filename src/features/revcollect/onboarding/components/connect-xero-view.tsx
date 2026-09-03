'use client';

import { ConnectBooksView } from './connect-books-view';

interface ConnectXeroViewProps {
  nextStep: {
    href: string;
    label: string;
  };
}

export function ConnectXeroView({ nextStep }: ConnectXeroViewProps) {
  return <ConnectBooksView provider='xero' nextStep={nextStep} />;
}
