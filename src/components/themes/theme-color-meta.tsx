'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
} as const;

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta || !resolvedTheme) return;

    meta.setAttribute(
      'content',
      resolvedTheme === 'dark' ? META_THEME_COLORS.dark : META_THEME_COLORS.light
    );
  }, [resolvedTheme]);

  return null;
}
