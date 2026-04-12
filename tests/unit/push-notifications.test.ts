import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('PushManager', () => {
  let PM: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  const mockSubscription = {
    endpoint: 'https://push.example.com/sub/123',
    unsubscribe: vi.fn().mockResolvedValue(true),
    toJSON: () => ({
      endpoint: 'https://push.example.com/sub/123',
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    }),
  };

  const mockPushManager = {
    getSubscription: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockResolvedValue(mockSubscription),
  };

  const mockRegistration = {
    pushManager: mockPushManager,
  };

  beforeEach(() => {
    mocks = setupGlobalMocks();

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.PushManager (the browser API, not our module)
    (window as any).PushManager = function () {};

    // Mock Notification
    (window as any).Notification = class {
      static permission = 'default';
      static requestPermission = vi.fn().mockResolvedValue('granted');
      constructor(public title: string, public options: any) {}
    };

    // Mock CONFIG
    (window as any).CONFIG = {
      VAPID_PUBLIC_KEY: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkCs7q32j7AU1HS4jVg1',
    };

    // Mock atob for VAPID key conversion
    if (typeof globalThis.atob === 'undefined') {
      (globalThis as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
    }

    document.body.innerHTML = '';
    mockPushManager.getSubscription.mockResolvedValue(null);
    mockPushManager.subscribe.mockResolvedValue(mockSubscription);
    mockSubscription.unsubscribe.mockResolvedValue(true);

    loadBrowserScript('js/push-notifications.js');
    // The script assigns to window.PushManager, but our mock is already there.
    // The script variable name is PushManager, so it overwrites.
    PM = (window as any).PushManager;
  });

  it('is defined on window', () => {
    expect(PM).toBeDefined();
    expect(typeof PM).toBe('object');
  });

  it('has init, isSupported, and unsubscribe methods', () => {
    expect(typeof PM.init).toBe('function');
    expect(typeof PM.isSupported).toBe('function');
    expect(typeof PM.unsubscribe).toBe('function');
  });

  describe('init', () => {
    it('sets _registration from serviceWorker.ready', async () => {
      await PM.init();
      expect(PM._registration).toBe(mockRegistration);
    });

    it('does nothing when serviceWorker is not supported', async () => {
      // Temporarily remove serviceWorker
      const saved = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Reload module to pick up the missing serviceWorker
      PM._registration = null;
      // Can't easily re-execute, so just call init and verify no crash
      // Re-check by verifying _registration stays null when PushManager not in window
      delete (window as any).PushManager;
      loadBrowserScript('js/push-notifications.js');
      PM = (window as any).PushManager;
      await PM.init();
      expect(PM._registration).toBeNull();

      // Restore
      Object.defineProperty(navigator, 'serviceWorker', {
        value: saved,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('isSupported', () => {
    it('returns true when all APIs are available', () => {
      // Ensure PushManager and Notification are on window
      (window as any).PushManager = function () {};
      (window as any).Notification = class { static permission = 'default'; };
      // Re-load to get fresh isSupported
      loadBrowserScript('js/push-notifications.js');
      PM = (window as any).PushManager;
      expect(PM.isSupported()).toBe(true);
    });
  });

  describe('getPermissionState', () => {
    it('returns current Notification.permission', () => {
      (window as any).Notification.permission = 'granted';
      expect(PM.getPermissionState()).toBe('granted');
    });

    it('returns "unsupported" when push is not supported', () => {
      // Remove Notification to make isSupported return false
      const savedNotif = (window as any).Notification;
      delete (window as any).Notification;
      expect(PM.getPermissionState()).toBe('unsupported');
      (window as any).Notification = savedNotif;
    });
  });

  describe('requestPermission', () => {
    it('returns "unsupported" when push is not available', async () => {
      const savedNotif = (window as any).Notification;
      delete (window as any).Notification;
      const result = await PM.requestPermission();
      expect(result).toBe('unsupported');
      (window as any).Notification = savedNotif;
    });

    it('calls Notification.requestPermission', async () => {
      await PM.requestPermission();
      expect((window as any).Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('does nothing when _registration is null', async () => {
      PM._registration = null;
      await expect(PM.unsubscribe()).resolves.toBeUndefined();
    });

    it('calls subscription.unsubscribe when subscription exists', async () => {
      PM._registration = mockRegistration;
      mockPushManager.getSubscription.mockResolvedValueOnce(mockSubscription);

      await PM.unsubscribe();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('removes subscription from database', async () => {
      PM._registration = mockRegistration;
      mockPushManager.getSubscription.mockResolvedValueOnce(mockSubscription);

      await PM.unsubscribe();

      expect(mocks.supabase.from).toHaveBeenCalledWith('push_subscriptions');
    });
  });

  describe('_urlBase64ToUint8Array', () => {
    it('returns a Uint8Array', () => {
      const result = PM._urlBase64ToUint8Array('AAAA');
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('handles URL-safe base64 characters', () => {
      // Should not throw for URL-safe base64 with - and _
      expect(() => PM._urlBase64ToUint8Array('AB-C_D')).not.toThrow();
    });
  });

  describe('showLocal', () => {
    it('creates a Notification when permission is granted', () => {
      (window as any).Notification.permission = 'granted';
      const n = PM.showLocal('Test Title', 'Test Body');
      expect(n).toBeDefined();
    });

    it('does nothing when permission is not granted', () => {
      (window as any).Notification.permission = 'denied';
      const n = PM.showLocal('Test Title', 'Test Body');
      expect(n).toBeUndefined();
    });
  });
});
