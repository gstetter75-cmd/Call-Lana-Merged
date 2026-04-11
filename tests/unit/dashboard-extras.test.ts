import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

// Mock localStorage
const store: Record<string, string> = {};
const mockStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k in store) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

describe('DashboardExtras', () => {
  let DE: any;

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true, configurable: true });
    mockStorage.clear();
    document.body.innerHTML = '';

    setupGlobalMocks();

    loadBrowserScript('js/dashboard-extras.js');
    DE = (window as any).DashboardExtras;
    // Reset internal state
    DE._favorites = null;
    DE.actions = [];
    DE._saveTimer = null;
  });

  describe('window globals', () => {
    it('exposes DashboardExtras on window', () => {
      expect((window as any).DashboardExtras).toBeDefined();
    });
  });

  describe('searchTranscripts', () => {
    it('returns empty array for short query', async () => {
      const result = await DE.searchTranscripts('ab');
      expect(result).toEqual([]);
    });

    it('returns empty array for null/undefined query', async () => {
      expect(await DE.searchTranscripts(null)).toEqual([]);
      expect(await DE.searchTranscripts(undefined)).toEqual([]);
    });

    it('returns empty array for empty string', async () => {
      expect(await DE.searchTranscripts('')).toEqual([]);
    });
  });

  describe('getFavorites', () => {
    it('returns empty array by default', () => {
      const favs = DE.getFavorites();
      expect(favs).toEqual([]);
    });

    it('returns stored favorites from localStorage', () => {
      mockStorage.setItem('calllana_fav_assistants', JSON.stringify(['a1', 'a2']));
      DE._favorites = null; // Reset cache
      const favs = DE.getFavorites();
      expect(favs).toEqual(['a1', 'a2']);
    });

    it('caches favorites after first call', () => {
      DE.getFavorites();
      mockStorage.setItem('calllana_fav_assistants', JSON.stringify(['changed']));
      // Should still return cached value
      expect(DE.getFavorites()).toEqual([]);
    });
  });

  describe('toggleFavorite', () => {
    it('adds assistant to favorites and returns true', () => {
      const added = DE.toggleFavorite('a1');
      expect(added).toBe(true);
      expect(DE.getFavorites()).toContain('a1');
    });

    it('removes assistant from favorites and returns false', () => {
      DE.toggleFavorite('a1'); // add
      const removed = DE.toggleFavorite('a1'); // remove
      expect(removed).toBe(false);
      expect(DE.getFavorites()).not.toContain('a1');
    });

    it('persists to localStorage', () => {
      DE.toggleFavorite('a1');
      const stored = JSON.parse(mockStorage.getItem('calllana_fav_assistants')!);
      expect(stored).toContain('a1');
    });
  });

  describe('isFavorite', () => {
    it('returns false for non-favorite', () => {
      expect(DE.isFavorite('unknown')).toBe(false);
    });

    it('returns true for favorited assistant', () => {
      DE.toggleFavorite('a1');
      expect(DE.isFavorite('a1')).toBe(true);
    });
  });

  describe('highlightMatch', () => {
    it('highlights the matched text with <mark> tag', () => {
      const result = DE.highlightMatch('Hello world test', 'world');
      expect(result).toContain('<mark');
      expect(result).toContain('world');
    });

    it('returns truncated text when no match found', () => {
      const result = DE.highlightMatch('Hello world', 'xyz');
      expect(result).not.toContain('<mark');
      expect(result).toContain('Hello world');
    });

    it('adds ellipsis for long text with match in middle', () => {
      const longText = 'A'.repeat(100) + 'MATCH' + 'B'.repeat(100);
      const result = DE.highlightMatch(longText, 'MATCH');
      expect(result).toContain('…');
      expect(result).toContain('MATCH');
    });
  });

  describe('logAction', () => {
    it('adds action to actions array', () => {
      DE.logAction('Clicked button');
      expect(DE.actions).toHaveLength(1);
      expect(DE.actions[0].text).toBe('Clicked button');
    });

    it('prepends new actions (newest first)', () => {
      DE.logAction('First');
      DE.logAction('Second');
      expect(DE.actions[0].text).toBe('Second');
    });

    it('caps actions at 20', () => {
      for (let i = 0; i < 25; i++) {
        DE.logAction(`Action ${i}`);
      }
      expect(DE.actions).toHaveLength(20);
    });
  });
});
