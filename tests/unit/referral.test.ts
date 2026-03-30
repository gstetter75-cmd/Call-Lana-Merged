import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Referral', () => {
  let Ref: any;

  beforeEach(() => {
    setupGlobalMocks();
    document.body.innerHTML = '';
    loadBrowserScript('js/referral.js');
    Ref = (window as any).Referral;
  });

  describe('_renderContent', () => {
    it('produces HTML with referral link', () => {
      const link = 'https://call-lana.de/registrierung.html?ref=abc123';
      const html = Ref._renderContent(link, { sent: 3, successful: 1 });
      expect(html).toContain('abc123');
      expect(html).toContain('Empfehlungslink');
    });

    it('contains stats values', () => {
      const link = 'https://call-lana.de/registrierung.html?ref=uid';
      const html = Ref._renderContent(link, { sent: 7, successful: 4 });
      expect(html).toContain('7');
      expect(html).toContain('4');
      expect(html).toContain('Einladungen versendet');
      expect(html).toContain('Erfolgreich geworben');
    });

    it('contains share buttons', () => {
      const link = 'https://call-lana.de/registrierung.html?ref=uid';
      const html = Ref._renderContent(link, { sent: 0, successful: 0 });
      expect(html).toContain('WhatsApp');
      expect(html).toContain('E-Mail');
      expect(html).toContain('shareWhatsApp');
      expect(html).toContain('shareEmail');
    });

    it('escapes HTML entities in link', () => {
      const link = 'https://call-lana.de/registrierung.html?ref=abc&foo=<bar>"baz"';
      const html = Ref._renderContent(link, { sent: 0, successful: 0 });
      // The escaped link should be in the input value attribute
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      expect(html).toContain('&quot;');
      // The raw unescaped characters should not appear in the value attribute
      expect(html).not.toContain('value="https://call-lana.de/registrierung.html?ref=abc&foo=<bar>');
    });

    it('contains the copy button', () => {
      const link = 'https://call-lana.de/registrierung.html?ref=uid';
      const html = Ref._renderContent(link, { sent: 0, successful: 0 });
      expect(html).toContain('copyReferralBtn');
      expect(html).toContain('Kopieren');
    });
  });

  describe('_loadStats', () => {
    it('returns placeholder data with sent and successful', async () => {
      const stats = await Ref._loadStats('any-user-id');
      expect(stats).toHaveProperty('sent');
      expect(stats).toHaveProperty('successful');
      expect(typeof stats.sent).toBe('number');
      expect(typeof stats.successful).toBe('number');
    });

    it('returns specific placeholder values', async () => {
      const stats = await Ref._loadStats('uid');
      expect(stats).toEqual({ sent: 3, successful: 1 });
    });
  });
});
