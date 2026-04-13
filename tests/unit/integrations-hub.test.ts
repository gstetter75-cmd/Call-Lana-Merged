import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('IntegrationsHub', () => {
  beforeEach(() => {
    setupGlobalMocks();

    // Mock Components.toast for file upload
    (window as any).Components = {
      toast: vi.fn(),
    };

    document.body.innerHTML = '';

    loadBrowserScript('js/integrations-hub.js');
  });

  const getHub = () => (window as any).IntegrationsHub;

  it('is defined on window', () => {
    expect(getHub()).toBeDefined();
  });

  it('has renderStripeSettings method', () => {
    expect(typeof getHub().renderStripeSettings).toBe('function');
  });

  it('has renderCalendarSync method', () => {
    expect(typeof getHub().renderCalendarSync).toBe('function');
  });

  it('has renderEmailSettings method', () => {
    expect(typeof getHub().renderEmailSettings).toBe('function');
  });

  it('has renderFileUpload method', () => {
    expect(typeof getHub().renderFileUpload).toBe('function');
  });

  it('has renderPhoneSettings method', () => {
    expect(typeof getHub().renderPhoneSettings).toBe('function');
  });

  it('renderStripeSettings renders Stripe UI into container', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    await getHub().renderStripeSettings(container);
    expect(container.innerHTML).toContain('Stripe');
    expect(container.innerHTML).toContain('Stripe Secret Key');
  });

  it('renderCalendarSync renders calendar providers', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    await getHub().renderCalendarSync(container);
    expect(container.innerHTML).toContain('Google Calendar');
    expect(container.innerHTML).toContain('Microsoft Outlook');
    expect(container.innerHTML).toContain('Apple Kalender');
  });
});
