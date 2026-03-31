import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('i18n', () => {
  // i18n.js uses class syntax and localStorage directly.
  // We load it via eval in global scope rather than loadBrowserScript
  // to avoid the localStorage parameter issue.

  beforeEach(() => {
    document.body.innerHTML = `
      <span data-i18n="nav.home">Platzhalter</span>
      <span data-i18n="nav.features">Platzhalter</span>
      <span data-i18n-html="hero.title">Platzhalter</span>
      <input data-i18n-placeholder="login.email" placeholder="">
      <div class="lang-de">Deutsch</div>
      <div class="lang-en hidden">English</div>
      <button class="lang-btn" data-lang="de">DE</button>
      <button class="lang-btn" data-lang="en">EN</button>
    `;
    // Create a localStorage mock
    const store: Record<string, string> = {};
    const lsMock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] ?? null,
    };
    Object.defineProperty(window, 'localStorage', { value: lsMock, writable: true, configurable: true });

    // Load i18n.js via eval with localStorage accessible
    const code = fs.readFileSync(path.resolve(__dirname, '../../i18n.js'), 'utf-8');
    const wrapped = `(function(window, document, localStorage) {
      ${code}
      window.i18n = i18n;
      window.translations = translations;
      window.I18n = I18n;
    })(window, document, window.localStorage);`;
    eval(wrapped);
  });

  it('i18n object is defined on window', () => {
    expect((window as any).i18n).toBeDefined();
  });

  it('defaults to German', () => {
    expect((window as any).i18n.currentLang).toBe('de');
  });

  describe('t()', () => {
    it('returns German translation for known key', () => {
      expect((window as any).i18n.t('nav.home')).toBe('Start');
    });

    it('returns English translation after switching', () => {
      (window as any).i18n.setLanguage('en');
      expect((window as any).i18n.t('nav.home')).toBe('Home');
    });

    it('returns key itself if not found', () => {
      expect((window as any).i18n.t('totally.unknown')).toBe('totally.unknown');
    });
  });

  describe('setLanguage()', () => {
    it('switches to English', () => {
      (window as any).i18n.setLanguage('en');
      expect((window as any).i18n.currentLang).toBe('en');
      expect(document.documentElement.lang).toBe('en');
    });

    it('falls back to German for unknown language', () => {
      (window as any).i18n.setLanguage('fr');
      expect((window as any).i18n.currentLang).toBe('de');
    });

    it('stores language in localStorage', () => {
      (window as any).i18n.setLanguage('en');
      expect((window as any).localStorage.getItem('calllana_language')).toBe('en');
    });
  });

  describe('translatePage()', () => {
    it('translates data-i18n elements', () => {
      (window as any).i18n.translatePage();
      const el = document.querySelector('[data-i18n="nav.home"]')!;
      expect(el.textContent).toBe('Start');
    });

    it('translates data-i18n-html with innerHTML', () => {
      (window as any).i18n.translatePage();
      const el = document.querySelector('[data-i18n-html="hero.title"]')!;
      expect(el.innerHTML).toContain('span');
    });

    it('translates data-i18n-placeholder', () => {
      (window as any).i18n.translatePage();
      const el = document.querySelector('[data-i18n-placeholder="login.email"]') as HTMLInputElement;
      expect(el.placeholder).toBe('E-Mail-Adresse');
    });

    it('toggles lang-de/lang-en visibility', () => {
      (window as any).i18n.setLanguage('en');
      expect(document.querySelector('.lang-de')!.classList.contains('hidden')).toBe(true);
      expect(document.querySelector('.lang-en')!.classList.contains('hidden')).toBe(false);
    });

    it('updates lang-btn active state', () => {
      (window as any).i18n.setLanguage('en');
      expect(document.querySelector('.lang-btn[data-lang="en"]')!.classList.contains('active')).toBe(true);
      expect(document.querySelector('.lang-btn[data-lang="de"]')!.classList.contains('active')).toBe(false);
    });
  });

  describe('translations', () => {
    it('has DE and EN translation sets', () => {
      const t = (window as any).translations;
      expect(t.de).toBeDefined();
      expect(t.en).toBeDefined();
    });

    it('DE has nav keys', () => {
      const de = (window as any).translations.de;
      expect(de['nav.home']).toBe('Start');
      expect(de['nav.features']).toBe('Funktionen');
    });

    it('EN has nav keys', () => {
      const en = (window as any).translations.en;
      expect(en['nav.home']).toBe('Home');
      expect(en['nav.features']).toBe('Features');
    });
  });
});
