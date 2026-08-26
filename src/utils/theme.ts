export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Reads OS color scheme preference (prefers-color-scheme: dark).
 */
export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Retrieves the stored theme preference.
 * Defaults to 'system' if not explicitly set.
 */
export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved as ThemePreference;
  }
  return 'system';
}

/**
 * Resolves a ThemePreference into an active ThemeMode ('light' | 'dark').
 */
export function resolveTheme(pref: ThemePreference): ThemeMode {
  if (pref === 'system') {
    return getSystemTheme();
  }
  return pref;
}

/**
 * Cycles through the 3 theme states: system -> light -> dark -> system.
 */
export function getNextThemePreference(current: ThemePreference): ThemePreference {
  if (current === 'system') return 'light';
  if (current === 'light') return 'dark';
  return 'system';
}
