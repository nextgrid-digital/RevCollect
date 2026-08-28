'use client';

import { createContext, use, type ReactNode } from 'react';

export interface AppUser {
  name: string;
  email: string;
}

const AppUserContext = createContext<AppUser>({ name: 'User', email: '' });

export function AppUserProvider({ user, children }: { user: AppUser; children: ReactNode }) {
  return <AppUserContext value={user}>{children}</AppUserContext>;
}

export function useAppUser(): AppUser {
  return use(AppUserContext);
}
