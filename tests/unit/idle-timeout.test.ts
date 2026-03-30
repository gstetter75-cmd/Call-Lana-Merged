import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('IdleTimeout', () => {
  let IT: any;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any warning elements
    const el = document.getElementById('idle-warning');
    if (el) el.remove();
  });

  function loadOnPage(pathname: string) {
    const mocks = setupGlobalMocks();
    // Set pathname before loading script (it auto-inits)
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        hostname: 'localhost',
        href: `http://localhost:8080${pathname}`,
        pathname,
        origin: 'http://localhost:8080',
      },
      writable: true,
      configurable: true,
    });
    loadBrowserScript('js/idle-timeout.js');
    IT = (window as any).IdleTimeout;
    return mocks;
  }

  describe('init() — protected pages', () => {
    it('activates on dashboard.html', () => {
      loadOnPage('/dashboard.html');
      expect(IT._warnTimer).not.toBeNull();
      expect(IT._logoutTimer).not.toBeNull();
    });

    it('activates on admin.html', () => {
      loadOnPage('/admin.html');
      expect(IT._warnTimer).not.toBeNull();
    });

    it('activates on sales.html', () => {
      loadOnPage('/sales.html');
      expect(IT._warnTimer).not.toBeNull();
    });

    it('activates on settings.html', () => {
      loadOnPage('/settings.html');
      expect(IT._warnTimer).not.toBeNull();
    });
  });

  describe('init() — public pages', () => {
    it('does NOT activate on login.html', () => {
      loadOnPage('/login.html');
      // On public pages _warnTimer stays null because init() returns early
      // The script sets timers via _resetTimers only on protected pages
      // But the auto-init at load time calls init() which returns early
      expect(IT._warnTimer).toBeNull();
    });

    it('does NOT activate on index.html', () => {
      loadOnPage('/index.html');
      expect(IT._warnTimer).toBeNull();
    });
  });

  describe('_resetTimers', () => {
    it('sets warn and logout timers', () => {
      loadOnPage('/dashboard.html');
      IT._warnTimer = null;
      IT._logoutTimer = null;
      IT._resetTimers();
      expect(IT._warnTimer).not.toBeNull();
      expect(IT._logoutTimer).not.toBeNull();
    });
  });

  describe('_showWarning', () => {
    it('creates warning element in DOM', () => {
      loadOnPage('/dashboard.html');
      IT._showWarning();
      const el = document.getElementById('idle-warning');
      expect(el).not.toBeNull();
      expect(el!.innerHTML).toContain('Inaktivität erkannt');
    });

    it('does not create duplicate warning', () => {
      loadOnPage('/dashboard.html');
      IT._showWarning();
      IT._showWarning();
      const els = document.querySelectorAll('#idle-warning');
      expect(els).toHaveLength(1);
    });
  });

  describe('_hideWarning', () => {
    it('removes warning element from DOM', () => {
      loadOnPage('/dashboard.html');
      IT._showWarning();
      expect(document.getElementById('idle-warning')).not.toBeNull();
      IT._hideWarning();
      expect(document.getElementById('idle-warning')).toBeNull();
      expect(IT._warningEl).toBeNull();
    });

    it('does nothing if no warning exists', () => {
      loadOnPage('/dashboard.html');
      expect(() => IT._hideWarning()).not.toThrow();
    });
  });

  describe('_onActivity', () => {
    it('hides warning and resets timers', () => {
      loadOnPage('/dashboard.html');
      IT._showWarning();
      const hideSpy = vi.spyOn(IT, '_hideWarning');
      const resetSpy = vi.spyOn(IT, '_resetTimers');
      IT._onActivity();
      expect(hideSpy).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('_doLogout', () => {
    it('calls clanaAuth.signOut and redirects', async () => {
      const mocks = loadOnPage('/dashboard.html');
      await IT._doLogout();
      expect(mocks.auth.signOut).toHaveBeenCalled();
      expect(window.location.href).toBe('login.html?reason=idle');
    });
  });

  describe('timer integration', () => {
    it('shows warning after WARN_AFTER_MS', () => {
      loadOnPage('/dashboard.html');
      vi.advanceTimersByTime(IT.WARN_AFTER_MS);
      expect(document.getElementById('idle-warning')).not.toBeNull();
    });

    it('calls _doLogout after LOGOUT_AFTER_MS', () => {
      loadOnPage('/dashboard.html');
      const logoutSpy = vi.spyOn(IT, '_doLogout').mockResolvedValue(undefined);
      vi.advanceTimersByTime(IT.LOGOUT_AFTER_MS);
      expect(logoutSpy).toHaveBeenCalled();
    });
  });
});
