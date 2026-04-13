import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Components (Marketing Page)', () => {
  beforeEach(() => {
    setupGlobalMocks();

    (window as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    document.body.innerHTML = '<div id="nav-container"></div><div id="footer-container"></div>';

    loadBrowserScript('js/components.js');
  });

  it('exposes __setLang on window', () => {
    expect(typeof (window as any).__setLang).toBe('function');
  });

  it('exposes __lang on window', () => {
    expect(typeof (window as any).__lang).toBe('function');
  });

  it('default language is de', () => {
    expect((window as any).__lang()).toBe('de');
  });
});
