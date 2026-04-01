import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Payment Validation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="paymentModal" style="display:none;">
        <div id="pmModalTitle"></div>
        <input id="sepaIban" />
        <input id="cardNumber" />
        <input id="cardExpiry" />
        <div id="ibanHint"></div>
        <div id="formSepa"></div>
        <div id="formCard" style="display:none;"></div>
        <div id="formPaypal" style="display:none;"></div>
        <button id="pmSaveBtn"></button>
      </div>
      <div class="pm-type-btn" data-type="sepa"></div>
      <div class="pm-type-btn" data-type="credit_card"></div>
    `;

    setupGlobalMocks();
    (window as any).showToast = vi.fn();
    (window as any).loadBillingData = vi.fn();
    (window as any).currentUser = { id: 'test-uid' };

    loadBrowserScript('js/dashboard-payment.js');
  });

  describe('validateIban', () => {
    const validateIban = () => (window as any).validateIban;

    it('accepts valid German IBAN', () => {
      // DE89 3704 0044 0532 0130 00 is a well-known test IBAN
      expect(validateIban()('DE89370400440532013000')).toBe(true);
    });

    it('accepts valid IBAN with spaces', () => {
      expect(validateIban()('DE89 3704 0044 0532 0130 00')).toBe(true);
    });

    it('rejects IBAN that is too short', () => {
      expect(validateIban()('DE8937040044')).toBe(false);
    });

    it('rejects IBAN that is too long', () => {
      expect(validateIban()('DE89370400440532013000123456789012345')).toBe(false);
    });

    it('rejects IBAN without country code', () => {
      expect(validateIban()('12345678901234567890')).toBe(false);
    });

    it('rejects IBAN with invalid checksum', () => {
      // Modified last digit — checksum should fail
      expect(validateIban()('DE89370400440532013001')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateIban()('')).toBe(false);
    });

    it('accepts valid Austrian IBAN', () => {
      // AT61 1904 3002 3457 3201
      expect(validateIban()('AT611904300234573201')).toBe(true);
    });
  });

  describe('selectPaymentType', () => {
    it('shows SEPA form and hides card form', () => {
      const fn = (window as any).selectPaymentType;
      fn('sepa');
      expect(document.getElementById('formSepa')!.style.display).toBe('block');
      expect(document.getElementById('formCard')!.style.display).toBe('none');
    });

    it('shows card form and hides SEPA form', () => {
      const fn = (window as any).selectPaymentType;
      fn('credit_card');
      expect(document.getElementById('formSepa')!.style.display).toBe('none');
      expect(document.getElementById('formCard')!.style.display).toBe('block');
    });
  });

  describe('openPaymentModal', () => {
    it('sets title for primary payment method', () => {
      const fn = (window as any).openPaymentModal;
      fn(1);
      expect(document.getElementById('pmModalTitle')!.textContent).toContain('Primäre');
    });

    it('sets title for backup payment method', () => {
      const fn = (window as any).openPaymentModal;
      fn(2);
      expect(document.getElementById('pmModalTitle')!.textContent).toContain('Ersatz');
    });

    it('opens modal', () => {
      const fn = (window as any).openPaymentModal;
      fn(1);
      expect(document.getElementById('paymentModal')!.style.display).toBe('flex');
    });
  });
});
