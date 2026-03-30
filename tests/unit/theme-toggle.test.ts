import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('ThemeToggle', () => {
  beforeEach(() => {
    setupGlobalMocks();
    document.body.innerHTML = '';
    // Clear theme from localStorage
    try { window.localStorage.removeItem('calllana_theme'); } catch (e) { /* ignore */ }
    try { window.localStorage.clear(); } catch (e) { /* ignore */ }

    // Mock matchMedia before loading the script
    (window as any).matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock setTimeout — don't execute injectButton polling
    vi.spyOn(window, 'setTimeout').mockImplementation((_fn: any) => 0 as any);
  });

  function loadThemeToggle() {
    loadBrowserScript('js/theme-toggle.js');
  }

  describe('apply()', () => {
    it('sets data-theme attribute on documentElement', () => {
      loadThemeToggle();
      (window as any).ThemeToggle.apply('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('stores theme in localStorage', () => {
      loadThemeToggle();
      (window as any).ThemeToggle.apply('light');
      expect(localStorage.getItem('calllana_theme')).toBe('light');
    });

    it('can switch between themes', () => {
      loadThemeToggle();
      (window as any).ThemeToggle.apply('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      (window as any).ThemeToggle.apply('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('toggle()', () => {
    it('switches from dark to light', () => {
      loadThemeToggle();
      (window as any).ThemeToggle.apply('dark');
      (window as any).ThemeToggle.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('switches from light to dark', () => {
      loadThemeToggle();
      (window as any).ThemeToggle.apply('light');
      (window as any).ThemeToggle.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('defaults to dark if no data-theme is set', () => {
      loadThemeToggle();
      document.documentElement.removeAttribute('data-theme');
      (window as any).ThemeToggle.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('init()', () => {
    it('reads light theme from localStorage', () => {
      localStorage.setItem('calllana_theme', 'light');
      loadThemeToggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('reads dark theme from localStorage', () => {
      localStorage.setItem('calllana_theme', 'dark');
      loadThemeToggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('falls back to system preference when no localStorage value', () => {
      (window as any).matchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      loadThemeToggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('falls back to light when system prefers light', () => {
      loadThemeToggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('calls matchMedia for system preference', () => {
      loadThemeToggle();
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });
});
