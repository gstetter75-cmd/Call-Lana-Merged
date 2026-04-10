import { describe, it, expect } from 'vitest';

// Mirror validation logic from encrypt-secret/index.ts
function validateEncryptionKey(hexKey: string | undefined): { valid: boolean; error?: string } {
  if (!hexKey) return { valid: false, error: 'Encryption not configured' };
  if (hexKey.length !== 64) return { valid: false, error: 'Key must be 64 hex chars (AES-256 = 32 bytes)' };
  if (!/^[0-9a-fA-F]+$/.test(hexKey)) return { valid: false, error: 'Key must be valid hex' };
  return { valid: true };
}

function validateEncryptInput(provider: any, secret: any): { valid: boolean; error?: string } {
  if (!provider) return { valid: false, error: 'Missing provider' };
  if (!secret) return { valid: false, error: 'Missing secret' };
  return { valid: true };
}

function buildEncryptionRef(provider: string, userId: string): string {
  return `enc:${provider}:${userId.slice(0, 8)}`;
}

describe('Encrypt Secret – Key Validation', () => {
  it('accepts valid 64-char hex key', () => {
    const key = 'a'.repeat(64);
    expect(validateEncryptionKey(key).valid).toBe(true);
  });

  it('rejects undefined key', () => {
    expect(validateEncryptionKey(undefined).valid).toBe(false);
  });

  it('rejects short key', () => {
    expect(validateEncryptionKey('abcdef').valid).toBe(false);
  });

  it('rejects non-hex characters', () => {
    const key = 'g'.repeat(64);
    expect(validateEncryptionKey(key).valid).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEncryptionKey('').valid).toBe(false);
  });
});

describe('Encrypt Secret – Input Validation', () => {
  it('accepts valid provider and secret', () => {
    expect(validateEncryptInput('vapi', 'my-secret-key').valid).toBe(true);
  });

  it('rejects missing provider', () => {
    expect(validateEncryptInput(null, 'secret').valid).toBe(false);
  });

  it('rejects missing secret', () => {
    expect(validateEncryptInput('vapi', null).valid).toBe(false);
  });

  it('rejects empty provider', () => {
    expect(validateEncryptInput('', 'secret').valid).toBe(false);
  });
});

describe('Encrypt Secret – Reference ID', () => {
  it('builds correct reference format', () => {
    const ref = buildEncryptionRef('vapi', '12345678-abcd-efgh');
    expect(ref).toBe('enc:vapi:12345678');
  });

  it('truncates user ID to 8 chars', () => {
    const ref = buildEncryptionRef('stripe', 'abcdefghijklmnop');
    expect(ref).toBe('enc:stripe:abcdefgh');
  });
});
