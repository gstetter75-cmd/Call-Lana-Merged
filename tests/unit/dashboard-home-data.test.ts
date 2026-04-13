import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('DashboardHomeData', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <select id="monthSelect"></select>
      <div id="csAnrufe"></div>
      <div id="csSms"></div>
      <div id="csKosten"></div>
      <circle id="donutArc" stroke-dashoffset="0"></circle>
      <div id="donutCenter"></div>
      <svg id="callChart"></svg>
    `;

    mocks = setupGlobalMocks();

    (window as any).$setText = vi.fn((id: string, val: any) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val);
    });
    (window as any).$setAttr = vi.fn((id: string, attr: string, val: any) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, String(val));
    });
    (window as any).formatMinutes = vi.fn((m: number) => m + ' min');
    (window as any).formatCurrency = vi.fn((v: number) => v + ' €');

    (window as any).clanaDB = {
      getStats: vi.fn().mockResolvedValue({
        success: true,
        stats: { totalCalls: 42, avgDuration: 180, statuses: { completed: 30 } },
      }),
      getSettings: vi.fn().mockResolvedValue({ success: true, data: { balance: 50 } }),
    };

    loadBrowserScript('js/dashboard-home-data.js');
  });

  describe('window exports', () => {
    it('exposes initMonthSelect on window', () => {
      expect(typeof (window as any).initMonthSelect).toBe('function');
    });

    it('exposes loadHomeData on window', () => {
      expect(typeof (window as any).loadHomeData).toBe('function');
    });
  });

  describe('initMonthSelect', () => {
    it('creates 6 option elements in #monthSelect', () => {
      (window as any).initMonthSelect();
      const sel = document.getElementById('monthSelect') as HTMLSelectElement;
      expect(sel.options.length).toBe(6);
    });

    it('first option has value "0"', () => {
      (window as any).initMonthSelect();
      const sel = document.getElementById('monthSelect') as HTMLSelectElement;
      expect(sel.options[0].value).toBe('0');
    });

    it('option text contains month name and year', () => {
      (window as any).initMonthSelect();
      const sel = document.getElementById('monthSelect') as HTMLSelectElement;
      const text = sel.options[0].textContent!;
      // Should contain a 4-digit year
      expect(text).toMatch(/\d{4}/);
    });

    it('does nothing if #monthSelect is missing', () => {
      document.getElementById('monthSelect')!.remove();
      // Should not throw
      (window as any).initMonthSelect();
    });
  });

  describe('loadHomeData', () => {
    it('calls clanaDB.getStats and clanaDB.getSettings', async () => {
      await (window as any).loadHomeData();
      expect((window as any).clanaDB.getStats).toHaveBeenCalled();
      expect((window as any).clanaDB.getSettings).toHaveBeenCalled();
    });

    it('sets call stats text on success', async () => {
      await (window as any).loadHomeData();
      expect((window as any).$setText).toHaveBeenCalledWith('csAnrufe', expect.anything());
    });

    it('sets zero values on failed stats', async () => {
      (window as any).clanaDB.getStats.mockResolvedValue({ success: false });
      await (window as any).loadHomeData();
      expect((window as any).$setText).toHaveBeenCalledWith('csAnrufe', '0');
    });
  });
});
