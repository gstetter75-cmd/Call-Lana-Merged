import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('RealtimeManager', () => {
  let RM: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    // Mock HomeWidgets
    (window as any).HomeWidgets = {
      loadMetricCards: vi.fn(),
      loadRecentCalls: vi.fn(),
      loadTodayAppointments: vi.fn(),
    };
    // Mock showToast
    (window as any).showToast = vi.fn();
    // Mock AppointmentsPage
    (window as any).AppointmentsPage = {
      loadAppointments: vi.fn(),
    };

    document.body.innerHTML = '';

    loadBrowserScript('js/realtime.js');
    RM = (window as any).RealtimeManager;
  });

  it('is defined on window', () => {
    expect(RM).toBeDefined();
    expect(typeof RM).toBe('object');
  });

  it('has init and destroy methods', () => {
    expect(typeof RM.init).toBe('function');
    expect(typeof RM.destroy).toBe('function');
  });

  describe('init', () => {
    it('subscribes to 5 channels when user is authenticated', async () => {
      await RM.init();

      // Should create 5 channels: calls, appointments, leads, messages, tasks
      expect(mocks.supabase.channel).toHaveBeenCalledTimes(5);
    });

    it('sets _userId from auth.getUser', async () => {
      await RM.init();
      expect(RM._userId).toBe('test-uid');
    });

    it('does not subscribe when user is not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValueOnce(null);
      await RM.init();

      expect(mocks.supabase.channel).not.toHaveBeenCalled();
    });

    it('calls destroy before subscribing to clean up old channels', async () => {
      // Pre-populate channels
      RM._channels = [{ fake: true }];
      await RM.init();

      // destroy should have been called, clearing old channels
      // After init, channels are freshly populated
      expect(RM._channels).toHaveLength(5);
    });

    it('creates channels with correct naming convention', async () => {
      await RM.init();

      const channelNames = mocks.supabase.channel.mock.calls.map((c: any) => c[0]);
      expect(channelNames).toContain('realtime-calls-test-uid');
      expect(channelNames).toContain('realtime-appointments-test-uid');
      expect(channelNames).toContain('realtime-leads-test-uid');
      expect(channelNames).toContain('realtime-messages-test-uid');
      expect(channelNames).toContain('realtime-tasks-test-uid');
    });
  });

  describe('destroy', () => {
    it('calls removeChannel for each channel', async () => {
      mocks.supabase.removeChannel = vi.fn();
      await RM.init();
      const channelCount = RM._channels.length;

      RM.destroy();

      expect(mocks.supabase.removeChannel).toHaveBeenCalledTimes(channelCount);
      expect(RM._channels).toHaveLength(0);
    });

    it('clears _channels array', () => {
      mocks.supabase.removeChannel = vi.fn();
      RM._channels = [{ id: 1 }, { id: 2 }];
      RM.destroy();
      expect(RM._channels).toHaveLength(0);
    });

    it('does not throw when removeChannel fails', () => {
      mocks.supabase.removeChannel = vi.fn().mockImplementation(() => {
        throw new Error('channel error');
      });
      RM._channels = [{ id: 1 }];
      expect(() => RM.destroy()).not.toThrow();
    });
  });

  describe('_onNewCall', () => {
    it('refreshes HomeWidgets on new call', () => {
      RM._onNewCall({ phone_number: '+49123', status: 'answered' });

      expect((window as any).HomeWidgets.loadMetricCards).toHaveBeenCalled();
      expect((window as any).HomeWidgets.loadRecentCalls).toHaveBeenCalled();
    });

    it('shows toast with phone number', () => {
      RM._onNewCall({ phone_number: '+49123456', status: 'answered' });

      expect((window as any).showToast).toHaveBeenCalledWith('Neuer Anruf: +49123456');
    });

    it('shows missed indicator for missed calls', () => {
      RM._onNewCall({ phone_number: '+49123456', status: 'missed' });

      expect((window as any).showToast).toHaveBeenCalledWith('Neuer Anruf: +49123456 (verpasst)');
    });

    it('updates call count badge in DOM', () => {
      document.body.innerHTML = '<span id="allCallsCount">5 Anrufe</span>';
      RM._onNewCall({ phone_number: '+49123', status: 'answered' });

      const badge = document.getElementById('allCallsCount')!;
      expect(badge.textContent).toBe('6 Anrufe');
    });
  });

  describe('_sanitize', () => {
    it('uses clanaUtils.sanitizeHtml when available', () => {
      const result = RM._sanitize('<script>alert("xss")</script>');
      expect(typeof result).toBe('string');
    });

    it('returns raw string when clanaUtils is not available', () => {
      const saved = (window as any).clanaUtils;
      delete (window as any).clanaUtils;
      const result = RM._sanitize('test');
      expect(result).toBe('test');
      (window as any).clanaUtils = saved;
    });
  });
});
