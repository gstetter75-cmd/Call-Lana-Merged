import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('ImpersonationManager', () => {
  let IM: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = '';

    mocks = setupGlobalMocks();

    // Ensure supabase insert returns a proper promise chain for _logAction
    const insertMock = vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null }));
    mocks.supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: insertMock,
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    (window as any).showToast = vi.fn();
    (window as any).AuthGuard = {
      getProfile: vi.fn().mockResolvedValue({ id: 'admin-1', email: 'admin@test.de', role: 'superadmin', first_name: 'Admin', last_name: 'User' }),
    };
    (window as any).Components = { toast: vi.fn() };

    // Clear sessionStorage
    sessionStorage.clear();

    loadBrowserScript('js/impersonation.js');
    IM = (window as any).ImpersonationManager;
    // Clear any timers
    clearTimeout(IM._timeoutTimer);
  });

  describe('window globals', () => {
    it('exposes ImpersonationManager on window', () => {
      expect((window as any).ImpersonationManager).toBeDefined();
    });
  });

  describe('isActive', () => {
    it('returns false by default', () => {
      expect(IM.isActive()).toBe(false);
    });

    it('returns true when impersonation state is set', () => {
      const state = {
        targetUserId: 'customer-1',
        targetProfile: { id: 'customer-1' },
        adminProfile: { id: 'admin-1' },
        startedAt: Date.now(),
      };
      sessionStorage.setItem(IM.STORAGE_KEY, JSON.stringify(state));
      expect(IM.isActive()).toBe(true);
    });
  });

  describe('getTargetUserId', () => {
    it('returns null when not active', () => {
      expect(IM.getTargetUserId()).toBeNull();
    });

    it('returns target user id when active', () => {
      const state = {
        targetUserId: 'customer-1',
        targetProfile: { id: 'customer-1' },
        adminProfile: { id: 'admin-1' },
        startedAt: Date.now(),
      };
      sessionStorage.setItem(IM.STORAGE_KEY, JSON.stringify(state));
      expect(IM.getTargetUserId()).toBe('customer-1');
    });
  });

  describe('start', () => {
    it('is a function', () => {
      expect(typeof IM.start).toBe('function');
    });
  });

  describe('stop', () => {
    it('is a function', () => {
      expect(typeof IM.stop).toBe('function');
    });

    it('clears sessionStorage state', () => {
      const state = {
        targetUserId: 'customer-1',
        targetProfile: { id: 'customer-1' },
        adminProfile: { id: 'admin-1' },
        startedAt: Date.now(),
      };
      sessionStorage.setItem(IM.STORAGE_KEY, JSON.stringify(state));

      // Mock location.href to prevent jsdom navigation error
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, href: '' },
        writable: true,
        configurable: true,
      });

      IM.stop();

      expect(sessionStorage.getItem(IM.STORAGE_KEY)).toBeNull();

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('isActionBlocked', () => {
    it('returns false when not impersonating', () => {
      expect(IM.isActionBlocked('change_password')).toBe(false);
    });

    it('returns true for blocked actions during impersonation', () => {
      const state = {
        targetUserId: 'customer-1',
        targetProfile: { id: 'customer-1' },
        adminProfile: { id: 'admin-1' },
        startedAt: Date.now(),
      };
      sessionStorage.setItem(IM.STORAGE_KEY, JSON.stringify(state));

      expect(IM.isActionBlocked('change_password')).toBe(true);
      expect(IM.isActionBlocked('delete_account')).toBe(true);
      expect(IM.isActionBlocked('modify_payment')).toBe(true);
    });

    it('returns false for non-blocked actions during impersonation', () => {
      const state = {
        targetUserId: 'customer-1',
        targetProfile: { id: 'customer-1' },
        adminProfile: { id: 'admin-1' },
        startedAt: Date.now(),
      };
      sessionStorage.setItem(IM.STORAGE_KEY, JSON.stringify(state));

      expect(IM.isActionBlocked('view_dashboard')).toBe(false);
    });
  });

  describe('timeout handling', () => {
    it('TIMEOUT_MS is 60 minutes', () => {
      expect(IM.TIMEOUT_MS).toBe(60 * 60 * 1000);
    });

    it('expired state returns null from _getState', () => {
      const state = {
        targetUserId: 'customer-1',
        targetProfile: { id: 'customer-1' },
        adminProfile: { id: 'admin-1' },
        startedAt: Date.now() - (61 * 60 * 1000), // 61 minutes ago
      };
      sessionStorage.setItem(IM.STORAGE_KEY, JSON.stringify(state));

      expect(IM.isActive()).toBe(false);
      // Should also clean up sessionStorage
      expect(sessionStorage.getItem(IM.STORAGE_KEY)).toBeNull();
    });
  });

  describe('_deferredPrompt equivalent', () => {
    it('_timeoutTimer is null by default', () => {
      // After clearing in beforeEach
      expect(IM._timeoutTimer).toBeNull();
    });
  });
});
