'use client';

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from 'next-themes';
import { ThemeColorMeta } from './theme-color-meta';

export default function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // next-themes injects an inline <script> to prevent theme flash before hydration.
  // React 19 warns when a <script> is in the client component tree. The SSR script
  // still runs from the initial HTML; on the client we use type="application/json"
  // so React does not treat it as an executable script during hydration.
  const scriptProps =
    typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const);

  return (
    <NextThemesProvider {...props} scriptProps={scriptProps}>
      <ThemeColorMeta />
      {children}
    </NextThemesProvider>
  );
}
