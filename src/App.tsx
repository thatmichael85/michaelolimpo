import { useState, useEffect } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from './design-system/theme';
import { ThemeToggle } from './components/layout/ThemeToggle';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Theme theme={neutralTheme}>
      <ThemeToggle currentTheme={theme} onToggleTheme={toggleTheme} />
      <LandingPage />
      <Footer />
    </Theme>
  );
}

export default App;
