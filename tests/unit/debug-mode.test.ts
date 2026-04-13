import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('DebugMode', () => {
  let lsStore: Record<string, string>;

  beforeEach(() => {
    document.body.innerHTML = '';

    setupGlobalMocks();

    // Create a working localStorage mock
    lsStore = {};
    const lsMock = {
      getItem: vi.fn((key: string) => lsStore[key] ?? null),
      setItem: vi.fn((key: string, val: string) => { lsStore[key] = val; }),
      removeItem: vi.fn((key: string) => { delete lsStore[key]; }),
      clear: vi.fn(() => { lsStore = {}; }),
      get length() { return Object.keys(lsStore).length; },
      key: vi.fn((i: number) => Object.keys(lsStore)[i] ?? null),
    };
    Object.defineProperty(window, 'localStorage', { value: lsMock, writable: true, configurable: true });

    // Mock performance.now for _patchFetch
    vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(0) });

    loadBrowserScript('js/debug-mode.js');
  });

  describe('DebugMode object', () => {
    it('is defined on window', () => {
      expect((window as any).DebugMode).toBeDefined();
    });

    it('has init as a function', () => {
      expect(typeof (window as any).DebugMode.init).toBe('function');
    });

    it('has getTokenInfo as a function', () => {
      expect(typeof (window as any).DebugMode.getTokenInfo).toBe('function');
    });

    it('has _patchFetch as a function', () => {
      expect(typeof (window as any).DebugMode._patchFetch).toBe('function');
    });
  });

  describe('active flag', () => {
    it('is false by default (no ?debug=true in URL)', () => {
      expect((window as any).DebugMode.active).toBe(false);
    });

    it('does not show debug badge when inactive', () => {
      const badge = document.querySelector('[style*="DEBUG"]');
      expect(badge).toBeNull();
    });
  });

  describe('queryLog', () => {
    it('is an empty array initially', () => {
      expect((window as any).DebugMode.queryLog).toEqual([]);
      expect(Array.isArray((window as any).DebugMode.queryLog)).toBe(true);
    });
  });

  describe('getTokenInfo', () => {
    it('returns an object', () => {
      const info = (window as any).DebugMode.getTokenInfo();
      expect(typeof info).toBe('object');
      expect(info).not.toBeNull();
    });

    it('returns "no session" status when no token in localStorage', () => {
      const info = (window as any).DebugMode.getTokenInfo();
      expect(info.status).toBe('no session');
    });

    it('returns error status for invalid token data', () => {
      lsStore['sb-fgwtptriileytmmotevs-auth-token'] = '{"access_token":"invalid"}';
      const info = (window as any).DebugMode.getTokenInfo();
      expect(info.status).toBe('error reading token');
    });
  });
});
