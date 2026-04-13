import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Components (Marketing Page)', () => {
  beforeEach(() => {
    setupGlobalMocks();

    // localStorage is already available in jsdom

    // Mock IntersectionObserver for initScrollReveal
    (window as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Create nav and footer containers
    document.body.innerHTML = '<div id="nav-container"></div><div id="footer-container"></div>';

    loadBrowserScript('js/components.js');
  });

  it('exposes __setLang on window', () => {
    expect(typeof (window as any).__setLang).toBe('function');
  });

  it('exposes __lang on window', () => {
    expect(typeof (window as any).__lang).toBe('function');
  });

  it('renderNav creates navigation markup', () => {
    // DOMContentLoaded fires automatically in the IIFE, but we trigger manually
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const nav = document.getElementById('nav-container');
    expect(nav?.innerHTML).toContain('nav');
    expect(nav?.innerHTML).toContain('funktionen.html');
  });

  it('renderFooter creates footer markup', () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const footer = document.getElementById('footer-container');
    expect(footer?.innerHTML).toContain('footer');
    expect(footer?.innerHTML).toContain('datenschutz.html');
  });

  it('default language is de', () => {
    expect((window as any).__lang()).toBe('de');
  });
});
