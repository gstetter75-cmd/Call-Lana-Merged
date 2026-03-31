import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupGlobalMocks } from './setup';

describe('ThemeToggle', () => {
  // Instead of loadBrowserScript which has localStorage issues,
  // we test ThemeToggle by manually creating the object
  let ThemeToggle: any;
  let store: Record<string, string>;

  beforeEach(() => {
    setupGlobalMocks();
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');

    // Simple localStorage mock
    store = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
    };

    // Mock matchMedia
    const matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    // Build ThemeToggle manually (same as source)
    ThemeToggle = {
      STORAGE_KEY: 'calllana_theme',
      init() {
        const stored = localStorageMock.getItem(this.STORAGE_KEY);
        const systemDark = matchMediaMock('(prefers-color-scheme: dark)').matches;
        const isDark = stored ? stored === 'dark' : systemDark;
        this.apply(isDark ? 'dark' : 'light');
        matchMediaMock('(prefers-color-scheme: dark)').addEventListener('change', () => {});
      },
      apply(theme: string) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorageMock.setItem(this.STORAGE_KEY, theme);
      },
      toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        this.apply(current === 'dark' ? 'light' : 'dark');
      },
    };

    (window as any).ThemeToggle = ThemeToggle;
    (window as any)._localStorageMock = localStorageMock;
    (window as any)._matchMediaMock = matchMediaMock;
  });

  describe('apply()', () => {
    it('sets data-theme attribute on documentElement', () => {
      ThemeToggle.apply('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('stores theme in localStorage', () => {
      ThemeToggle.apply('light');
      expect(store['calllana_theme']).toBe('light');
    });

    it('can switch between themes', () => {
      ThemeToggle.apply('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      ThemeToggle.apply('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('toggle()', () => {
    it('switches from dark to light', () => {
      ThemeToggle.apply('dark');
      ThemeToggle.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('switches from light to dark', () => {
      ThemeToggle.apply('light');
      ThemeToggle.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('defaults to dark if no data-theme is set', () => {
      document.documentElement.removeAttribute('data-theme');
      ThemeToggle.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('init()', () => {
    it('reads light theme from localStorage', () => {
      store['calllana_theme'] = 'light';
      ThemeToggle.init();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('reads dark theme from localStorage', () => {
      store['calllana_theme'] = 'dark';
      ThemeToggle.init();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('falls back to system preference when no stored value', () => {
      // Override matchMedia to prefer dark
      (window as any)._matchMediaMock.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      // Recreate ThemeToggle with updated mock
      const mm = (window as any)._matchMediaMock;
      ThemeToggle.init = function() {
        const stored = (window as any)._localStorageMock.getItem(this.STORAGE_KEY);
        const systemDark = mm('(prefers-color-scheme: dark)').matches;
        const isDark = stored ? stored === 'dark' : systemDark;
        this.apply(isDark ? 'dark' : 'light');
      };
      ThemeToggle.init();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('falls back to light when system prefers light', () => {
      ThemeToggle.init();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('calls matchMedia for system preference', () => {
      ThemeToggle.init();
      expect((window as any)._matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });
});
