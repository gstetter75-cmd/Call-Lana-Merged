import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('AvailabilityModule', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    document.body.innerHTML = '<div id="avail-subtabs"></div><div id="avail-subtab-content"></div>';

    (window as any).clanaDB = {
      getAvailability: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getWorkingHours: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getTimeOffRequests: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getVacationBalance: vi.fn().mockResolvedValue({ success: true, data: { totalDays: 30, usedDays: 10, remaining: 20 } }),
      getAllProfiles: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getTeamAvailability: vi.fn().mockResolvedValue({ success: true, timeOff: [], workHours: [] }),
      setWorkingHours: vi.fn().mockResolvedValue({ success: true }),
      createTimeOffRequest: vi.fn().mockResolvedValue({ success: true }),
    };
    (window as any).clanaUtils = { sanitizeHtml: (s: string) => s };
    (window as any).Components = { toast: vi.fn() };
    (window as any).openModal = vi.fn();
    (window as any).closeModal = vi.fn();

    loadBrowserScript('js/availability.js');
  });

  it('AvailabilityModule is defined', () => {
    expect((window as any).AvailabilityModule).toBeDefined();
  });

  describe('init()', () => {
    it('creates sub-tab buttons', () => {
      (window as any).AvailabilityModule.init();
      const container = document.getElementById('avail-subtabs')!;
      expect(container.innerHTML).toContain('Kalender');
      expect(container.innerHTML).toContain('Arbeitszeiten');
      expect(container.innerHTML).toContain('Urlaub');
      expect(container.innerHTML).toContain('Team');
    });

    it('does nothing if container missing', () => {
      document.getElementById('avail-subtabs')!.remove();
      expect(() => (window as any).AvailabilityModule.init()).not.toThrow();
    });
  });

  describe('switchSubTab()', () => {
    it('updates currentSubTab', () => {
      const mod = (window as any).AvailabilityModule;
      mod.switchSubTab('hours');
      expect(mod.currentSubTab).toBe('hours');
    });

    it('switches to vacation', () => {
      const mod = (window as any).AvailabilityModule;
      mod.switchSubTab('vacation');
      expect(mod.currentSubTab).toBe('vacation');
    });
  });

  describe('getWeekNumber()', () => {
    it('returns correct week number', () => {
      const getWeekNumber = (window as any).getWeekNumber;
      // Jan 1 2026 is a Thursday → KW 1
      expect(getWeekNumber(new Date(2026, 0, 1))).toBe(1);
      // Dec 28 2025 is a Sunday → KW 52 of 2025
      expect(getWeekNumber(new Date(2025, 11, 29))).toBe(1);
    });

    it('returns a number between 1 and 53', () => {
      const getWeekNumber = (window as any).getWeekNumber;
      const wn = getWeekNumber(new Date());
      expect(wn).toBeGreaterThanOrEqual(1);
      expect(wn).toBeLessThanOrEqual(53);
    });
  });

  describe('applyTemplate()', () => {
    it('sets office template values', () => {
      // Set up DOM for working hours editor
      let html = '';
      for (let i = 0; i < 7; i++) {
        html += `
          <input type="checkbox" id="wh-active-${i}">
          <span id="wh-row-${i}"><input type="time" id="wh-start-${i}"><input type="time" id="wh-end-${i}"></span>
          <input type="time" id="wh-bs-${i}">
          <input type="time" id="wh-be-${i}">
        `;
      }
      document.body.innerHTML += html;

      (window as any).AvailabilityModule.applyTemplate('office');

      // Mon-Fri should be active
      for (let i = 0; i < 5; i++) {
        expect((document.getElementById(`wh-active-${i}`) as HTMLInputElement).checked).toBe(true);
        expect((document.getElementById(`wh-start-${i}`) as HTMLInputElement).value).toBe('09:00');
        expect((document.getElementById(`wh-end-${i}`) as HTMLInputElement).value).toBe('17:00');
      }
      // Sat/Sun should be inactive
      expect((document.getElementById('wh-active-5') as HTMLInputElement).checked).toBe(false);
      expect((document.getElementById('wh-active-6') as HTMLInputElement).checked).toBe(false);
    });

    it('does nothing for unknown template', () => {
      expect(() => (window as any).AvailabilityModule.applyTemplate('unknown')).not.toThrow();
    });
  });
});
