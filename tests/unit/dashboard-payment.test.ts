import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Dashboard Payment', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <button class="pm-type-btn active" data-type="sepa">SEPA</button>
      <button class="pm-type-btn" data-type="credit_card">Karte</button>
      <button class="pm-type-btn" data-type="paypal">PayPal</button>
      <div id="formSepa" style="display:block;"></div>
      <div id="formCard" style="display:none;"></div>
      <div id="formPaypal" style="display:none;"></div>
      <div id="paymentModal" style="display:none;">
        <span id="pmModalTitle"></span>
        <input id="sepaIban" value="">
        <span id="ibanHint"></span>
        <input id="cardNumber" value="">
        <input id="cardExpiry" value="">
      </div>
      <button id="pmSaveBtn">Speichern</button>
    `;

    mocks = setupGlobalMocks();
    (window as any).showToast = vi.fn();

    loadBrowserScript('js/dashboard-payment.js');
  });

  describe('selectPaymentType()', () => {
    it('switches to credit_card type', () => {
      (window as any).selectPaymentType('credit_card');
      expect((window as any).currentPmType).toBe('credit_card');
      expect(document.getElementById('formCard')!.style.display).toBe('block');
      expect(document.getElementById('formSepa')!.style.display).toBe('none');
    });

    it('switches to paypal type', () => {
      (window as any).selectPaymentType('paypal');
      expect((window as any).currentPmType).toBe('paypal');
      expect(document.getElementById('formPaypal')!.style.display).toBe('block');
    });

    it('switches back to sepa', () => {
      (window as any).selectPaymentType('credit_card');
      (window as any).selectPaymentType('sepa');
      expect((window as any).currentPmType).toBe('sepa');
      expect(document.getElementById('formSepa')!.style.display).toBe('block');
    });
  });

  describe('openPaymentModal()', () => {
    it('sets priority and shows modal', () => {
      (window as any).openPaymentModal(1);
      expect((window as any).currentPmPriority).toBe(1);
      expect(document.getElementById('pmModalTitle')!.textContent).toContain('Primäre');
      expect(document.getElementById('paymentModal')!.style.display).toBe('flex');
    });

    it('sets backup priority title', () => {
      (window as any).openPaymentModal(2);
      expect((window as any).currentPmPriority).toBe(2);
      expect(document.getElementById('pmModalTitle')!.textContent).toContain('Ersatz');
    });
  });

  describe('closePaymentModal()', () => {
    it('hides modal', () => {
      document.getElementById('paymentModal')!.style.display = 'flex';
      (window as any).closePaymentModal();
      expect(document.getElementById('paymentModal')!.style.display).toBe('none');
    });
  });

  describe('validateIban()', () => {
    it('validates a correct German IBAN', () => {
      // DE89 3704 0044 0532 0130 00 is a known test IBAN
      expect((window as any).validateIban('DE89370400440532013000')).toBe(true);
    });

    it('validates with spaces', () => {
      expect((window as any).validateIban('DE89 3704 0044 0532 0130 00')).toBe(true);
    });

    it('rejects too short IBAN', () => {
      expect((window as any).validateIban('DE89')).toBe(false);
    });

    it('rejects invalid format', () => {
      expect((window as any).validateIban('1234567890123456')).toBe(false);
    });

    it('rejects invalid checksum', () => {
      expect((window as any).validateIban('DE00370400440532013000')).toBe(false);
    });

    it('validates Austrian IBAN', () => {
      // AT61 1904 3002 3457 3201
      expect((window as any).validateIban('AT611904300234573201')).toBe(true);
    });
  });

  describe('defaults', () => {
    it('currentPmPriority defaults to 1', () => {
      expect((window as any).currentPmPriority).toBe(1);
    });

    it('currentPmType defaults to sepa', () => {
      expect((window as any).currentPmType).toBe('sepa');
    });
  });
});
