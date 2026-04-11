import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createSupabaseMock } from './setup';

describe('HomeWidgets', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;
  let supabase: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    supabase = createSupabaseMock();

    // Add removeChannel mock needed by destroy()
    (supabase as any).removeChannel = vi.fn();

    mocks = setupGlobalMocks({ supabase });

    // Mock clanaDB for loadRecentCalls
    (window as any).clanaDB = {
      getCalls: vi.fn().mockResolvedValue({ data: [] }),
    };

    document.body.innerHTML = `
      <div id="metricCallsToday"></div>
      <div id="metricBookingRate"></div>
      <div id="metricMinutes"></div>
      <div id="metricSentiment"></div>
      <div id="metricCallsTrend"></div>
      <div id="emergency-banner"></div>
      <div id="widget-recent-calls"></div>
      <div id="widget-appointments"></div>
      <div id="widget-appointments-count"></div>
      <div id="widget-top-leads"></div>
    `;

    loadBrowserScript('js/dashboard-home-widgets.js');
  });

  it('HomeWidgets is defined on window', () => {
    expect((window as any).HomeWidgets).toBeDefined();
  });

  it('has init method', () => {
    expect(typeof (window as any).HomeWidgets.init).toBe('function');
  });

  it('has loadMetricCards method', () => {
    expect(typeof (window as any).HomeWidgets.loadMetricCards).toBe('function');
  });

  it('has loadRecentCalls method', () => {
    expect(typeof (window as any).HomeWidgets.loadRecentCalls).toBe('function');
  });

  it('has loadTodayAppointments method', () => {
    expect(typeof (window as any).HomeWidgets.loadTodayAppointments).toBe('function');
  });

  it('has loadTopLeads method', () => {
    expect(typeof (window as any).HomeWidgets.loadTopLeads).toBe('function');
  });

  it('has initEmergencyBanner method', () => {
    expect(typeof (window as any).HomeWidgets.initEmergencyBanner).toBe('function');
  });

  it('has destroy method', () => {
    expect(typeof (window as any).HomeWidgets.destroy).toBe('function');
  });

  describe('loadRecentCalls()', () => {
    it('shows empty state when no calls', async () => {
      (window as any).clanaDB.getCalls.mockResolvedValue({ data: [] });
      await (window as any).HomeWidgets.loadRecentCalls();
      const container = document.getElementById('widget-recent-calls')!;
      expect(container.innerHTML).toContain('Noch keine Anrufe');
    });

    it('renders call rows when data exists', async () => {
      (window as any).clanaDB.getCalls.mockResolvedValue({
        data: [
          { created_at: '2026-04-11T10:00:00Z', phone_number: '+49123456', duration: 120, status: 'completed' },
        ],
      });
      await (window as any).HomeWidgets.loadRecentCalls();
      const container = document.getElementById('widget-recent-calls')!;
      expect(container.innerHTML).toContain('+49123456');
    });

    it('shows error state on failure', async () => {
      (window as any).clanaDB.getCalls.mockRejectedValue(new Error('fail'));
      await (window as any).HomeWidgets.loadRecentCalls();
      const container = document.getElementById('widget-recent-calls')!;
      expect(container.innerHTML).toContain('Fehler beim Laden');
    });
  });

  describe('loadTopLeads()', () => {
    it('shows empty state when no leads', async () => {
      const qm = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      supabase.from.mockReturnValue(qm);

      await (window as any).HomeWidgets.loadTopLeads();
      const container = document.getElementById('widget-top-leads')!;
      expect(container.innerHTML).toContain('Keine Leads vorhanden');
    });
  });

  describe('destroy()', () => {
    it('removes emergency channel if exists', () => {
      const hw = (window as any).HomeWidgets;
      hw._emergencyChannel = { id: 'test' };
      hw.destroy();
      expect(supabase.removeChannel).toHaveBeenCalled();
      expect(hw._emergencyChannel).toBeNull();
    });

    it('does nothing if no channel', () => {
      const hw = (window as any).HomeWidgets;
      hw._emergencyChannel = null;
      hw.destroy();
      expect(supabase.removeChannel).not.toHaveBeenCalled();
    });
  });

  describe('_showEmergencyBanner()', () => {
    it('renders emergency alert in container', () => {
      const container = document.getElementById('emergency-banner')!;
      (window as any).HomeWidgets._showEmergencyBanner(container, {
        phone_number: '+49999888',
        created_at: '2026-04-11T14:30:00Z',
      });
      expect(container.innerHTML).toContain('Notfall-Anruf');
      expect(container.innerHTML).toContain('+49999888');
    });
  });
});
