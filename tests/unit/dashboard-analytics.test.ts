import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('DashboardAnalytics', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="usage-alert"></div>
      <div id="assistant-performance"></div>
    `;

    mocks = setupGlobalMocks();

    // Mock clanaDB
    (window as any).clanaDB = {
      getSettings: vi.fn().mockResolvedValue({ success: true, data: { balance: 100, monthly_limit: 500 } }),
      getAssistants: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getCalls: vi.fn().mockResolvedValue({ success: true, data: [] }),
    };
    (window as any).clanaUtils = {
      sanitizeHtml: (s: string) => s,
    };
    (window as any).navigateToPage = vi.fn();

    loadBrowserScript('js/dashboard-analytics.js');
  });

  describe('checkUsageAlerts', () => {
    it('shows critical alert when balance <= 10', async () => {
      (window as any).clanaDB.getSettings.mockResolvedValue({
        success: true,
        data: { balance: 5, monthly_limit: 500 },
      });

      await (window as any).DashboardAnalytics.checkUsageAlerts();
      const alert = document.getElementById('usage-alert')!;
      expect(alert.innerHTML).toContain('Guthaben fast aufgebraucht');
      expect(alert.innerHTML).toContain('5.00');
    });

    it('shows warning when balance <= 50', async () => {
      (window as any).clanaDB.getSettings.mockResolvedValue({
        success: true,
        data: { balance: 30, monthly_limit: 500 },
      });

      await (window as any).DashboardAnalytics.checkUsageAlerts();
      const alert = document.getElementById('usage-alert')!;
      expect(alert.innerHTML).toContain('Guthaben wird knapp');
    });

    it('clears alert when balance > 50', async () => {
      (window as any).clanaDB.getSettings.mockResolvedValue({
        success: true,
        data: { balance: 200, monthly_limit: 500 },
      });

      // First set some content
      document.getElementById('usage-alert')!.innerHTML = 'old alert';
      await (window as any).DashboardAnalytics.checkUsageAlerts();
      expect(document.getElementById('usage-alert')!.innerHTML).toBe('');
    });

    it('does nothing when settings fetch fails', async () => {
      (window as any).clanaDB.getSettings.mockResolvedValue({ success: false });
      document.getElementById('usage-alert')!.innerHTML = 'old';
      await (window as any).DashboardAnalytics.checkUsageAlerts();
      // Should not crash, alert stays unchanged
      expect(document.getElementById('usage-alert')!.innerHTML).toBe('old');
    });
  });

  describe('loadAssistantPerformance', () => {
    it('shows empty message when no assistants', async () => {
      (window as any).clanaDB.getAssistants.mockResolvedValue({ success: true, data: [] });
      await (window as any).DashboardAnalytics.loadAssistantPerformance();
      const container = document.getElementById('assistant-performance')!;
      expect(container.innerHTML).toContain('Erstelle Assistenten');
    });

    it('renders performance table with assistants', async () => {
      (window as any).clanaDB.getAssistants.mockResolvedValue({
        success: true,
        data: [
          { id: 'a1', name: 'Bot A', status: 'active' },
          { id: 'a2', name: 'Bot B', status: 'active' },
        ],
      });
      (window as any).clanaDB.getCalls.mockResolvedValue({
        success: true,
        data: [
          { assistant_id: 'a1', status: 'completed', duration: 120 },
          { assistant_id: 'a1', status: 'completed', duration: 60 },
          { assistant_id: 'a2', status: 'failed', duration: 30 },
        ],
      });

      await (window as any).DashboardAnalytics.loadAssistantPerformance();
      const container = document.getElementById('assistant-performance')!;
      expect(container.innerHTML).toContain('Bot A');
      expect(container.innerHTML).toContain('Bot B');
      expect(container.innerHTML).toContain('100%'); // Bot A: 2/2 completed
    });

    it('does nothing when container missing', async () => {
      document.getElementById('assistant-performance')!.remove();
      // Should not throw
      await (window as any).DashboardAnalytics.loadAssistantPerformance();
    });
  });
});
