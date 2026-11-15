import { useEffect, useState } from 'react';
import {
  getNextThemePreference,
  getStoredThemePreference,
  resolveTheme,
  type ThemeMode,
  type ThemePreference,
} from './theme';

/**
 * 3-state theme preference (system -> light -> dark), persisted in localStorage and
 * mirrored to `<html data-theme>`. Follows the OS while on "system".
 */
export function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<ThemeMode>(() => resolveTheme(preference));

  useEffect(() => {
    const mediaQuery =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const updateResolved = () => {
      const current = resolveTheme(preference);
      setResolvedTheme(current);
      document.documentElement.setAttribute('data-theme', current);
    };

    updateResolved();

    if (preference === 'system' && mediaQuery) {
      mediaQuery.addEventListener('change', updateResolved);
      return () => {
        mediaQuery.removeEventListener('change', updateResolved);
      };
    }
  }, [preference]);

  const toggleTheme = () => {
    const nextPref = getNextThemePreference(preference);
    setPreference(nextPref);
    if (nextPref === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', nextPref);
    }
  };

  return { preference, resolvedTheme, toggleTheme };
}
