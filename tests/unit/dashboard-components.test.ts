import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('DashboardComponents', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = '<div id="sidebar-container"></div>';

    mocks = setupGlobalMocks();

    (window as any).AuthGuard = {
      getHomeUrl: vi.fn().mockReturnValue('/dashboard.html'),
      getDisplayName: vi.fn().mockReturnValue('Test User'),
      getInitials: vi.fn().mockReturnValue('TU'),
    };

    (window as any).ImpersonationManager = undefined;

    // Mock fetch for sidebar loading
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('<aside class="sidebar"></aside>'),
    }));

    // Mock requestAnimationFrame for toast
    vi.stubGlobal('requestAnimationFrame', (cb: Function) => { cb(); return 0; });

    loadBrowserScript('js/dashboard-components.js');
  });

  describe('Components object', () => {
    it('is defined on window', () => {
      expect((window as any).Components).toBeDefined();
    });

    it('has loadSidebar as a function', () => {
      expect(typeof (window as any).Components.loadSidebar).toBe('function');
    });

    it('has toast as a function', () => {
      expect(typeof (window as any).Components.toast).toBe('function');
    });

    it('has loadAnnouncements as a function', () => {
      expect(typeof (window as any).Components.loadAnnouncements).toBe('function');
    });
  });

  describe('Components.toast', () => {
    it('creates a toast element in the DOM', () => {
      (window as any).Components.toast('Test message', 'success');
      const toast = document.querySelector('.cl-toast');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toBe('Test message');
    });

    it('applies cl-toast-error class for error type', () => {
      (window as any).Components.toast('Error occurred', 'error');
      const toast = document.querySelector('.cl-toast');
      expect(toast!.classList.contains('cl-toast-error')).toBe(true);
    });

    it('applies cl-toast-success class for success type', () => {
      (window as any).Components.toast('All good', 'success');
      const toast = document.querySelector('.cl-toast');
      expect(toast!.classList.contains('cl-toast-success')).toBe(true);
    });

    it('applies cl-toast-warning class for warning type', () => {
      (window as any).Components.toast('Be careful', 'warning');
      const toast = document.querySelector('.cl-toast');
      expect(toast!.classList.contains('cl-toast-warning')).toBe(true);
    });

    it('removes previous toast before showing new one', () => {
      (window as any).Components.toast('First', 'info');
      (window as any).Components.toast('Second', 'success');
      const toasts = document.querySelectorAll('.cl-toast');
      expect(toasts.length).toBe(1);
      expect(toasts[0].textContent).toBe('Second');
    });

    it('sets role and aria-live attributes', () => {
      (window as any).Components.toast('Accessible', 'info');
      const toast = document.querySelector('.cl-toast')!;
      expect(toast.getAttribute('role')).toBe('status');
      expect(toast.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Components.loadSidebar', () => {
    it('fetches sidebar HTML', async () => {
      await (window as any).Components.loadSidebar('sidebar-container', { role: 'customer', email: 'test@test.de' });
      expect(fetch).toHaveBeenCalledWith('components/sidebar.html');
    });

    it('handles missing container gracefully', async () => {
      // Should not throw
      await (window as any).Components.loadSidebar('nonexistent', { role: 'customer' });
    });
  });
});
