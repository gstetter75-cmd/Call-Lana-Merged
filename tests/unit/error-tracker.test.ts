import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('ErrorTracker', () => {
  let supabase: any;

  beforeEach(() => {
    const mocks = setupGlobalMocks();
    supabase = mocks.supabase;

    // Mock crypto.randomUUID
    if (!window.crypto) {
      (window as any).crypto = {};
    }
    (window.crypto as any).randomUUID = vi.fn().mockReturnValue('test-session-id');

    // Clear any previous handlers
    window.onerror = null;

    loadBrowserScript('js/error-tracker.js');
  });

  it('sets window.onerror handler', () => {
    expect(window.onerror).toBeDefined();
    expect(typeof window.onerror).toBe('function');
  });

  it('sends error to supabase on window.onerror', () => {
    const onerror = window.onerror as Function;
    onerror('Test error', 'http://localhost/test.js', 10, 5, new Error('Test error'));

    expect(supabase.from).toHaveBeenCalledWith('error_logs');
  });

  it('ignores errors with 404 in message', () => {
    const onerror = window.onerror as Function;
    onerror('404 not found', 'http://localhost/test.js', 1, 1, null);

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('ignores network errors', () => {
    const onerror = window.onerror as Function;
    onerror('Failed to fetch', 'http://localhost/test.js', 1, 1, null);

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('ignores errors from external sources', () => {
    const onerror = window.onerror as Function;
    onerror('Some error', 'https://cdn.external.com/lib.js', 1, 1, null);

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('rate limits after 5 errors per minute', () => {
    const onerror = window.onerror as Function;

    // Send 5 errors (all should go through)
    for (let i = 0; i < 5; i++) {
      onerror(`Error ${i}`, 'http://localhost/test.js', i, 1, new Error(`Error ${i}`));
    }

    expect(supabase.from).toHaveBeenCalledTimes(5);

    // 6th error should be rate limited
    supabase.from.mockClear();
    onerror('Error 6', 'http://localhost/test.js', 6, 1, new Error('Error 6'));

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('builds payload with correct structure', () => {
    const onerror = window.onerror as Function;
    const err = new Error('Structured test');
    onerror('Structured test', 'http://localhost/app.js', 42, 10, err);

    const insertCall = supabase.from().insert;
    const payload = insertCall.mock.calls[0][0];

    expect(payload.service).toBe('frontend');
    expect(payload.severity).toBe('error');
    expect(payload.message).toBe('Structured test');
    expect(payload.metadata.line).toBe(42);
    expect(payload.metadata.column).toBe(10);
  });
});
