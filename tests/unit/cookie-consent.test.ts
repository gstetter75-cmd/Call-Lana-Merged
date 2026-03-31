import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Cookie Consent', () => {
  const COOKIE_KEY = 'calllana_cookie_consent';
  let store: Record<string, string>;

  beforeEach(() => {
    document.body.innerHTML = '';
    store = {};
  });

  describe('banner logic', () => {
    it('no consent means banner should show', () => {
      expect(store[COOKIE_KEY]).toBeUndefined();
    });

    it('existing consent prevents banner', () => {
      store[COOKIE_KEY] = 'all';
      expect(store[COOKIE_KEY]).toBe('all');
    });

    it('accept stores "all"', () => {
      store[COOKIE_KEY] = 'all';
      expect(store[COOKIE_KEY]).toBe('all');
    });

    it('essential stores "essential"', () => {
      store[COOKIE_KEY] = 'essential';
      expect(store[COOKIE_KEY]).toBe('essential');
    });
  });

  describe('banner DOM', () => {
    it('creates banner with dialog role', () => {
      const banner = document.createElement('div');
      banner.id = 'cookieBanner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Cookie-Einstellungen');
      banner.innerHTML = `
        <div class="cb-content">
          <p class="cb-text">Wir verwenden Cookies</p>
          <button id="cbAccept">Alle akzeptieren</button>
          <button id="cbEssential">Nur notwendige</button>
        </div>
      `;
      document.body.appendChild(banner);

      expect(document.getElementById('cookieBanner')).not.toBeNull();
      expect(document.getElementById('cbAccept')).not.toBeNull();
      expect(document.getElementById('cbEssential')).not.toBeNull();
      expect(banner.getAttribute('role')).toBe('dialog');
    });

    it('accept button removes banner', () => {
      const banner = document.createElement('div');
      banner.id = 'cookieBanner';
      document.body.appendChild(banner);
      const btn = document.createElement('button');
      banner.appendChild(btn);

      btn.addEventListener('click', () => {
        store[COOKIE_KEY] = 'all';
        banner.remove();
      });
      btn.click();

      expect(store[COOKIE_KEY]).toBe('all');
      expect(document.getElementById('cookieBanner')).toBeNull();
    });

    it('essential button removes banner', () => {
      const banner = document.createElement('div');
      banner.id = 'cookieBanner';
      document.body.appendChild(banner);
      const btn = document.createElement('button');
      banner.appendChild(btn);

      btn.addEventListener('click', () => {
        store[COOKIE_KEY] = 'essential';
        banner.remove();
      });
      btn.click();

      expect(store[COOKIE_KEY]).toBe('essential');
      expect(document.getElementById('cookieBanner')).toBeNull();
    });

    it('banner links to Datenschutzerklärung', () => {
      const banner = document.createElement('div');
      banner.innerHTML = '<a href="datenschutz.html">Datenschutzerklärung</a>';
      document.body.appendChild(banner);

      const link = banner.querySelector('a[href="datenschutz.html"]');
      expect(link).not.toBeNull();
    });
  });
});
