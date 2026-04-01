import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Dashboard Billing', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    // Set up DOM elements the script expects
    document.body.innerHTML = `
      <div id="topupModal" style="display:none"></div>
      <input id="customTopup" value="">
      <button id="topupConfirmBtn">Aufladen</button>
      <input id="autoReloadToggle" type="checkbox">
      <input id="autoReloadThreshold" value="1000">
      <input id="autoReloadAmount" value="5000">
    `;

    mocks = setupGlobalMocks();
    // Mock dependencies
    (window as any).showToast = vi.fn();
    (window as any).currentUser = { id: 'test-uid' };
    (window as any).loadBillingData = vi.fn().mockResolvedValue(undefined);
    (window as any).supabaseClient.rpc = vi.fn().mockResolvedValue({ data: true, error: null });

    loadBrowserScript('js/dashboard-billing.js');
  });

  describe('formatCents', () => {
    it('formats 5000 cents as EUR', () => {
      const result = (window as any).formatCents(5000);
      // German locale: "50,00 €" or "50,00 EUR"
      expect(result).toContain('50');
      expect(result).toMatch(/€|EUR/);
    });

    it('formats 0 cents', () => {
      const result = (window as any).formatCents(0);
      expect(result).toContain('0');
    });

    it('formats 12345 cents as 123,45', () => {
      const result = (window as any).formatCents(12345);
      expect(result).toContain('123');
    });

    it('formats 99 cents correctly', () => {
      const result = (window as any).formatCents(99);
      expect(result).toContain('0,99') ;
    });
  });

  describe('OVERAGE_RATE_CENTS', () => {
    it('equals 15 (0.15€/min)', () => {
      expect((window as any).OVERAGE_RATE_CENTS).toBe(15);
    });
  });

  describe('selectedTopupAmount', () => {
    it('defaults to 5000 (50€)', () => {
      expect((window as any).selectedTopupAmount).toBe(5000);
    });
  });

  describe('openTopupModal / closeTopupModal', () => {
    it('openTopupModal shows modal', () => {
      // Need .topup-btn.active for selectTopup
      document.body.innerHTML += '<button class="topup-btn active" data-amount="5000"></button>';
      (window as any).openTopupModal();
      expect(document.getElementById('topupModal')!.style.display).toBe('flex');
    });

    it('closeTopupModal hides modal', () => {
      const modal = document.getElementById('topupModal')!;
      modal.style.display = 'flex';
      (window as any).closeTopupModal();
      expect(modal.style.display).toBe('none');
    });
  });

  describe('selectTopup', () => {
    it('updates selectedTopupAmount from button dataset', () => {
      const btn = document.createElement('button');
      btn.classList.add('topup-btn');
      btn.dataset.amount = '10000';
      document.body.appendChild(btn);

      (window as any).selectTopup(btn);
      expect((window as any).selectedTopupAmount).toBe(10000);
      expect(btn.classList.contains('active')).toBe(true);
    });
  });

  describe('confirmTopup', () => {
    it('rejects amounts below 500 cents', async () => {
      (document.getElementById('customTopup') as HTMLInputElement).value = '4';
      await (window as any).confirmTopup();
      expect((window as any).showToast).toHaveBeenCalledWith('Mindestbetrag: 5,00 €', true);
    });

    it('rejects amounts above 50000 cents', async () => {
      (document.getElementById('customTopup') as HTMLInputElement).value = '501';
      await (window as any).confirmTopup();
      expect((window as any).showToast).toHaveBeenCalledWith('Maximalbetrag: 500,00 €', true);
    });
  });
});
