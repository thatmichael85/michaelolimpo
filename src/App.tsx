import { useState, useEffect } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from './design-system/theme';
import { ThemeToggle } from './components/layout/ThemeToggle';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import {
  getStoredThemePreference,
  resolveTheme,
  getNextThemePreference,
  type ThemePreference,
  type ThemeMode,
} from './utils/theme';

export function App() {
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

  return (
    <Theme theme={neutralTheme}>
      <ThemeToggle
        preference={preference}
        resolvedTheme={resolvedTheme}
        onToggleTheme={toggleTheme}
      />
      <LandingPage />
      <Footer />
    </Theme>
  );
}

export default App;
