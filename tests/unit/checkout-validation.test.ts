import { describe, it, expect } from 'vitest';

// Test checkout validation logic (mirrored from create-checkout-session/index.ts)
const ALLOWED_ORIGINS = ['https://call-lana.de', 'https://www.call-lana.de'];

function validateRedirectUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    if (ALLOWED_ORIGINS.includes(parsed.origin)) return url;
  } catch { /* invalid URL */ }
  return fallback;
}

// Test expiry year parsing logic (mirrored from create-payment-method/index.ts)
function parseExpiryYear(raw: string): string {
  return raw.trim().length === 4 ? raw.trim() : `20${raw.trim()}`;
}

describe('Checkout URL Validation', () => {
  const fallback = 'https://call-lana.de/dashboard.html?payment=success';

  it('allows call-lana.de URLs', () => {
    const url = 'https://call-lana.de/dashboard.html?payment=success&plan=pro';
    expect(validateRedirectUrl(url, fallback)).toBe(url);
  });

  it('allows www.call-lana.de URLs', () => {
    const url = 'https://www.call-lana.de/settings.html';
    expect(validateRedirectUrl(url, fallback)).toBe(url);
  });

  it('blocks external domains', () => {
    const url = 'https://evil.com/phishing';
    expect(validateRedirectUrl(url, fallback)).toBe(fallback);
  });

  it('blocks javascript: URLs', () => {
    const url = 'javascript:alert(1)';
    expect(validateRedirectUrl(url, fallback)).toBe(fallback);
  });

  it('blocks data: URLs', () => {
    const url = 'data:text/html,<script>alert(1)</script>';
    expect(validateRedirectUrl(url, fallback)).toBe(fallback);
  });

  it('returns fallback for undefined', () => {
    expect(validateRedirectUrl(undefined, fallback)).toBe(fallback);
  });

  it('returns fallback for empty string', () => {
    expect(validateRedirectUrl('', fallback)).toBe(fallback);
  });

  it('blocks HTTP (non-HTTPS) URLs', () => {
    const url = 'http://call-lana.de/dashboard.html';
    expect(validateRedirectUrl(url, fallback)).toBe(fallback);
  });

  it('blocks URLs with different subdomains', () => {
    const url = 'https://api.call-lana.de/webhook';
    expect(validateRedirectUrl(url, fallback)).toBe(fallback);
  });
});

describe('Expiry Year Parsing', () => {
  it('parses 2-digit year correctly', () => {
    expect(parseExpiryYear('24')).toBe('2024');
    expect(parseExpiryYear('30')).toBe('2030');
  });

  it('keeps 4-digit year as-is', () => {
    expect(parseExpiryYear('2024')).toBe('2024');
    expect(parseExpiryYear('2030')).toBe('2030');
  });

  it('does NOT produce 6-digit year from 4-digit input', () => {
    // This was the original bug: 20${2024} = 202024
    const result = parseExpiryYear('2024');
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result).toBe('2024');
  });

  it('handles whitespace', () => {
    expect(parseExpiryYear(' 24 ')).toBe('2024');
    expect(parseExpiryYear(' 2025 ')).toBe('2025');
  });
});
