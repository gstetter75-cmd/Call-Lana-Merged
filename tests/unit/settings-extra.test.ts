import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('SettingsExtra', () => {
  let SE: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    const ids = [
      'emergencyPhone', 'emergencyChannel', 'emergencyKeywords',
      'emergencyActive', 'emergency-err',
      'calendarStatus', 'btnConnectCalendar', 'slotDuration',
      'bookingWindow', 'bookingStart', 'bookingEnd', 'calendar-err',
      'forwardingRules',
      'addonWhatsapp', 'addonOutbound', 'addonReviews',
      'addonLeadScoring', 'addonSentiment',
    ];
    document.body.innerHTML = ids.map(id => {
      // Input elements for form fields
      if (['emergencyPhone', 'emergencyKeywords', 'slotDuration', 'bookingWindow', 'bookingStart', 'bookingEnd'].includes(id)) {
        return `<input id="${id}" value="">`;
      }
      if (id === 'emergencyChannel') {
        return `<select id="${id}"><option value="sms">SMS</option><option value="email">E-Mail</option></select>`;
      }
      return `<div id="${id}"></div>`;
    }).join('');

    mocks = setupGlobalMocks();

    (window as any).showToast = vi.fn();
    (window as any).clanaDB = {
      getSettings: vi.fn().mockResolvedValue({ success: true, data: {} }),
      saveSettings: vi.fn().mockResolvedValue({ success: true }),
    };

    loadBrowserScript('js/settings-extra.js');
    SE = (window as any).SettingsExtra;
  });

  it('exports SettingsExtra to window', () => {
    expect(SE).toBeDefined();
    expect(typeof SE).toBe('object');
  });

  it('has loadEmergency method', () => {
    expect(typeof SE.loadEmergency).toBe('function');
  });

  it('has saveEmergency method', () => {
    expect(typeof SE.saveEmergency).toBe('function');
  });

  it('has loadCalendar method', () => {
    expect(typeof SE.loadCalendar).toBe('function');
  });

  it('has connectCalendar method', () => {
    expect(typeof SE.connectCalendar).toBe('function');
  });

  it('has loadForwardingRules method', () => {
    expect(typeof SE.loadForwardingRules).toBe('function');
  });

  it('has loadAddons method', () => {
    expect(typeof SE.loadAddons).toBe('function');
  });

  describe('initTab', () => {
    it('calls loadEmergency for emergency tab', async () => {
      const spy = vi.spyOn(SE, 'loadEmergency').mockResolvedValue(undefined);
      await SE.initTab('emergency');
      expect(spy).toHaveBeenCalled();
    });

    it('calls loadCalendar for calendar tab', async () => {
      const spy = vi.spyOn(SE, 'loadCalendar').mockResolvedValue(undefined);
      await SE.initTab('calendar');
      expect(spy).toHaveBeenCalled();
    });

    it('calls loadForwardingRules for forwarding tab', async () => {
      const spy = vi.spyOn(SE, 'loadForwardingRules').mockResolvedValue(undefined);
      await SE.initTab('forwarding');
      expect(spy).toHaveBeenCalled();
    });

    it('calls loadAddons for addons tab', async () => {
      const spy = vi.spyOn(SE, 'loadAddons').mockResolvedValue(undefined);
      await SE.initTab('addons');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('saveEmergency', () => {
    it('shows error when phone is empty', async () => {
      (document.getElementById('emergencyPhone') as HTMLInputElement).value = '';

      await SE.saveEmergency();

      expect(document.getElementById('emergency-err')!.textContent).toContain('Notfall-Nummer');
      expect((window as any).clanaDB.saveSettings).not.toHaveBeenCalled();
    });

    it('saves settings when phone is provided', async () => {
      (document.getElementById('emergencyPhone') as HTMLInputElement).value = '+4917012345';

      await SE.saveEmergency();

      expect((window as any).clanaDB.saveSettings).toHaveBeenCalled();
    });
  });

  describe('loadEmergency', () => {
    it('populates form fields from settings', async () => {
      (window as any).clanaDB.getSettings.mockResolvedValue({
        success: true,
        data: {
          emergency_phone: '+49170999',
          alert_channel: 'email',
          emergency_keywords: ['feuer', 'wasser'],
        },
      });

      await SE.loadEmergency();

      expect((document.getElementById('emergencyPhone') as HTMLInputElement).value).toBe('+49170999');
      expect((document.getElementById('emergencyChannel') as HTMLSelectElement).value).toBe('email');
      expect((document.getElementById('emergencyKeywords') as HTMLInputElement).value).toBe('feuer, wasser');
    });
  });
});
