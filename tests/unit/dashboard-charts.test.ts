import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('DashboardCharts', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    document.body.innerHTML = '<div id="chart-calls-7days"></div>';
    (window as any).Logger = { warn: vi.fn() };

    loadBrowserScript('js/dashboard-charts.js');
  });

  it('DashboardCharts is defined', () => {
    expect((window as any).DashboardCharts).toBeDefined();
  });

  describe('_fetchLast7Days()', () => {
    it('returns 7 labels and 7 values', async () => {
      // Mock auth
      mocks.auth.getEffectiveUserId.mockResolvedValue('uid');
      const qm = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).DashboardCharts._fetchLast7Days();
      expect(result.labels).toHaveLength(7);
      expect(result.values).toHaveLength(7);
    });

    it('returns zeros when no user', async () => {
      mocks.auth.getEffectiveUserId.mockResolvedValue(null);

      const result = await (window as any).DashboardCharts._fetchLast7Days();
      expect(result.values.every((v: number) => v === 0)).toBe(true);
    });

    it('counts calls per day', async () => {
      mocks.auth.getEffectiveUserId.mockResolvedValue('uid');
      const today = new Date().toISOString().slice(0, 10);
      const qm = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [
            { created_at: today + 'T10:00:00' },
            { created_at: today + 'T14:00:00' },
          ],
          error: null,
        }),
      };
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).DashboardCharts._fetchLast7Days();
      // Last value (today) should be 2
      expect(result.values[6]).toBe(2);
    });

    it('uses day abbreviations as labels', async () => {
      mocks.auth.getEffectiveUserId.mockResolvedValue(null);
      const result = await (window as any).DashboardCharts._fetchLast7Days();
      const validDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      result.labels.forEach((l: string) => {
        expect(validDays).toContain(l);
      });
    });
  });

  describe('init()', () => {
    it('does nothing if container missing', async () => {
      document.getElementById('chart-calls-7days')!.remove();
      await (window as any).DashboardCharts.init();
      // Should not throw
    });

    it('shows error message on fetch failure', async () => {
      mocks.auth.getEffectiveUserId.mockRejectedValue(new Error('fail'));
      await (window as any).DashboardCharts.init();
      const container = document.getElementById('chart-calls-7days')!;
      expect(container.innerHTML).toContain('nicht verfuegbar');
    });
  });
});
