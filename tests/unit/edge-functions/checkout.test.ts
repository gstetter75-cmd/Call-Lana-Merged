import { describe, it, expect } from 'vitest';

// Mirror validation logic from create-checkout-session/index.ts
const ALLOWED_ORIGINS = ['https://call-lana.de', 'https://www.call-lana.de'];
const MIN_TOPUP_CENTS = 500;
const MAX_TOPUP_CENTS = 50000;

function validateRedirectUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    if (ALLOWED_ORIGINS.includes(parsed.origin)) return url;
  } catch { /* invalid URL */ }
  return fallback;
}

function validateTopupAmount(cents: any): { valid: boolean; error?: string } {
  const n = Number(cents);
  if (!Number.isInteger(n) || n < MIN_TOPUP_CENTS || n > MAX_TOPUP_CENTS) {
    return { valid: false, error: `Amount must be between ${MIN_TOPUP_CENTS / 100}€ and ${MAX_TOPUP_CENTS / 100}€` };
  }
  return { valid: true };
}

describe('Checkout Session – URL Validation', () => {
  const fallback = 'https://call-lana.de/dashboard.html?payment=success';

  it('allows call-lana.de URLs', () => {
    expect(validateRedirectUrl('https://call-lana.de/dashboard.html', fallback))
      .toBe('https://call-lana.de/dashboard.html');
  });

  it('allows www.call-lana.de URLs', () => {
    expect(validateRedirectUrl('https://www.call-lana.de/settings.html', fallback))
      .toBe('https://www.call-lana.de/settings.html');
  });

  it('blocks external domains', () => {
    expect(validateRedirectUrl('https://evil.com/phishing', fallback)).toBe(fallback);
  });

  it('blocks javascript: URLs', () => {
    expect(validateRedirectUrl('javascript:alert(1)', fallback)).toBe(fallback);
  });

  it('returns fallback for undefined', () => {
    expect(validateRedirectUrl(undefined, fallback)).toBe(fallback);
  });
});

describe('Checkout Session – Amount Validation', () => {
  it('accepts valid top-up amount (5€)', () => {
    expect(validateTopupAmount(500).valid).toBe(true);
  });

  it('accepts valid top-up amount (500€)', () => {
    expect(validateTopupAmount(50000).valid).toBe(true);
  });

  it('rejects amount below minimum', () => {
    expect(validateTopupAmount(100).valid).toBe(false);
  });

  it('rejects amount above maximum', () => {
    expect(validateTopupAmount(60000).valid).toBe(false);
  });

  it('rejects non-integer amount', () => {
    expect(validateTopupAmount(15.5).valid).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validateTopupAmount('abc').valid).toBe(false);
  });

  it('rejects negative amount', () => {
    expect(validateTopupAmount(-500).valid).toBe(false);
  });
});
