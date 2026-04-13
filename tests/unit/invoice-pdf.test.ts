import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('generateInvoicePdf', () => {
  beforeEach(() => {
    setupGlobalMocks();
    (window as any).jspdf = undefined;
    loadBrowserScript('js/invoice-pdf.js');
  });

  it('generateInvoicePdf is a function on window', () => {
    expect(typeof (window as any).generateInvoicePdf).toBe('function');
  });
});
