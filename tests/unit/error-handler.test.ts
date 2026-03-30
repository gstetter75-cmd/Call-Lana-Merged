import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('ErrorHandler', () => {
  let addEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupGlobalMocks();
    // Spy on addEventListener before loading the script
    addEventSpy = vi.spyOn(window, 'addEventListener');
    // Mock navigator.onLine to true so init doesn't trigger offline state
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    // Stub _patchFetch to avoid complex fetch mocking
    loadBrowserScript('js/error-handler.js');
    // Override _patchFetch to no-op before calling init
    (window as any).ErrorHandler._patchFetch = vi.fn();
  });

  const getHandler = () => (window as any).ErrorHandler;

  it('is defined on window', () => {
    expect(getHandler()).toBeDefined();
  });

  describe('init()', () => {
    it('registers online and offline event listeners', () => {
      getHandler().init();

      const eventNames = addEventSpy.mock.calls.map((c: any[]) => c[0]);
      expect(eventNames).toContain('online');
      expect(eventNames).toContain('offline');
    });

    it('calls _setOffline if navigator is offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const spy = vi.spyOn(getHandler(), '_setOffline');
      getHandler().init();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_setOffline()', () => {
    it('creates a banner element in the document', () => {
      getHandler()._setOffline();
      const banner = document.getElementById('error-banner');
      expect(banner).not.toBeNull();
      expect(banner!.textContent).toContain('Keine Internetverbindung');
    });

    it('sets _isOffline to true', () => {
      getHandler()._setOffline();
      expect(getHandler()._isOffline).toBe(true);
    });

    it('does not create duplicate banner on second call', () => {
      getHandler()._setOffline();
      getHandler()._isOffline = false; // reset to allow second call
      getHandler()._setOffline();
      const banners = document.querySelectorAll('#error-banner');
      expect(banners.length).toBe(1);
    });
  });

  describe('_setOnline()', () => {
    it('removes the banner and sets _isOffline to false', () => {
      getHandler()._setOffline();
      expect(getHandler()._isOffline).toBe(true);

      getHandler()._setOnline();
      expect(getHandler()._isOffline).toBe(false);
      expect(document.getElementById('error-banner')).toBeNull();
    });

    it('does nothing if already online', () => {
      getHandler()._isOffline = false;
      const spy = vi.spyOn(getHandler(), '_hideBanner');
      getHandler()._setOnline();
      expect(spy).not.toHaveBeenCalled();
    });

    it('calls registered retry callbacks', () => {
      const cb = vi.fn();
      getHandler().onRetry(cb);
      getHandler()._isOffline = true;
      getHandler()._setOnline();
      expect(cb).toHaveBeenCalled();
    });
  });

  describe('onRetry() and retry()', () => {
    it('onRetry registers callbacks', () => {
      const cb = vi.fn();
      getHandler().onRetry(cb);
      expect(getHandler()._retryCallbacks).toContain(cb);
    });

    it('retry() calls all registered callbacks', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      getHandler().onRetry(cb1);
      getHandler().onRetry(cb2);
      getHandler().retry();
      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });

    it('retry() hides banner', () => {
      getHandler()._setOffline();
      expect(document.getElementById('error-banner')).not.toBeNull();
      getHandler().retry();
      expect(document.getElementById('error-banner')).toBeNull();
    });

    it('retry() ignores errors in callbacks', () => {
      const failCb = vi.fn(() => { throw new Error('fail'); });
      const okCb = vi.fn();
      getHandler().onRetry(failCb);
      getHandler().onRetry(okCb);
      // Should not throw
      expect(() => getHandler().retry()).not.toThrow();
      expect(okCb).toHaveBeenCalled();
    });
  });

  describe('showComponentError()', () => {
    it('creates error HTML in the specified container', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      getHandler().showComponentError('test-container', 'Something broke');
      expect(container.innerHTML).toContain('Something broke');
      expect(container.innerHTML).toContain('Seite neu laden');
    });

    it('uses default message when none provided', () => {
      const container = document.createElement('div');
      container.id = 'default-msg-container';
      document.body.appendChild(container);

      getHandler().showComponentError('default-msg-container');
      expect(container.innerHTML).toContain('Daten konnten nicht geladen werden');
    });

    it('does nothing for non-existent container', () => {
      // Should not throw
      expect(() => getHandler().showComponentError('nonexistent')).not.toThrow();
    });
  });

  describe('_hideBanner()', () => {
    it('removes existing banner element', () => {
      getHandler()._setOffline();
      expect(document.getElementById('error-banner')).not.toBeNull();
      getHandler()._hideBanner();
      expect(document.getElementById('error-banner')).toBeNull();
    });

    it('sets _bannerEl to null', () => {
      getHandler()._setOffline();
      getHandler()._hideBanner();
      expect(getHandler()._bannerEl).toBeNull();
    });

    it('does nothing if no banner exists', () => {
      expect(() => getHandler()._hideBanner()).not.toThrow();
    });
  });
});
