import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSystemTheme,
  getStoredThemePreference,
  resolveTheme,
  getNextThemePreference,
} from './theme';

describe('theme utils', () => {
  let mockStore: Record<string, string> = {};

  const mockStorage = {
    getItem: (key: string) => mockStore[key] || null,
    setItem: (key: string, value: string) => {
      mockStore[key] = String(value);
    },
    removeItem: (key: string) => {
      delete mockStore[key];
    },
    clear: () => {
      mockStore = {};
    },
    length: 0,
    key: () => null,
  };

  beforeEach(() => {
    mockStore = {};
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStoredThemePreference', () => {
    it('returns "system" by default when no theme is in localStorage', () => {
      expect(getStoredThemePreference()).toBe('system');
    });

    it('returns "system" when explicitly stored in localStorage', () => {
      window.localStorage.setItem('theme', 'system');
      expect(getStoredThemePreference()).toBe('system');
    });

    it('returns "light" when stored in localStorage', () => {
      window.localStorage.setItem('theme', 'light');
      expect(getStoredThemePreference()).toBe('light');
    });

    it('returns "dark" when stored in localStorage', () => {
      window.localStorage.setItem('theme', 'dark');
      expect(getStoredThemePreference()).toBe('dark');
    });
  });

  describe('getNextThemePreference', () => {
    it('cycles from system -> light -> dark -> system', () => {
      expect(getNextThemePreference('system')).toBe('light');
      expect(getNextThemePreference('light')).toBe('dark');
      expect(getNextThemePreference('dark')).toBe('system');
    });
  });

  describe('getSystemTheme', () => {
    it('returns "dark" when prefers-color-scheme matches dark', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(getSystemTheme()).toBe('dark');
    });

    it('returns "light" when prefers-color-scheme is not dark', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(getSystemTheme()).toBe('light');
    });
  });

  describe('resolveTheme', () => {
    it('resolves system preference to current system theme', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(resolveTheme('system')).toBe('dark');
    });

    it('resolves explicit light and dark preferences', () => {
      expect(resolveTheme('light')).toBe('light');
      expect(resolveTheme('dark')).toBe('dark');
    });
  });
});
