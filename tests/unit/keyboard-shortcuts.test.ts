import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('KeyboardShortcuts', () => {
  let KS: any;

  beforeEach(() => {
    setupGlobalMocks();
    document.body.innerHTML = '';
    // Provide optional globals as undefined by default
    (window as any).GlobalSearch = undefined;
    (window as any).closeModal = undefined;

    loadBrowserScript('js/keyboard-shortcuts.js');
    KS = (window as any).KeyboardShortcuts;
    // Reset state between tests
    KS.shortcuts = {};
    KS.helpVisible = false;
  });

  function pressKey(key: string, options: Partial<KeyboardEventInit> = {}, target?: Element) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, ...options });
    (target || document).dispatchEvent(event);
  }

  describe('init()', () => {
    it('registers keydown listener on document', () => {
      const spy = vi.spyOn(document, 'addEventListener');
      KS.init({});
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
      spy.mockRestore();
    });
  });

  describe('custom shortcuts', () => {
    it('calls handler when corresponding key is pressed', () => {
      const handler = vi.fn();
      KS.init({ n: handler });
      pressKey('n');
      expect(handler).toHaveBeenCalled();
    });

    it('ignores shortcuts with metaKey', () => {
      const handler = vi.fn();
      KS.init({ n: handler });
      pressKey('n', { metaKey: true });
      expect(handler).not.toHaveBeenCalled();
    });

    it('ignores shortcuts with ctrlKey', () => {
      const handler = vi.fn();
      KS.init({ n: handler });
      pressKey('n', { ctrlKey: true });
      expect(handler).not.toHaveBeenCalled();
    });

    it('ignores shortcuts with altKey', () => {
      const handler = vi.fn();
      KS.init({ n: handler });
      pressKey('n', { altKey: true });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('"/" opens GlobalSearch', () => {
    it('calls GlobalSearch.open() if available', () => {
      const openSpy = vi.fn();
      (window as any).GlobalSearch = { open: openSpy };
      KS.init({});
      pressKey('/');
      expect(openSpy).toHaveBeenCalled();
    });

    it('does nothing if GlobalSearch is undefined', () => {
      (window as any).GlobalSearch = undefined;
      KS.init({});
      // Should not throw
      expect(() => pressKey('/')).not.toThrow();
    });
  });

  describe('"?" toggles help overlay', () => {
    it('shows help overlay on first press', () => {
      KS.init({});
      pressKey('?');
      expect(KS.helpVisible).toBe(true);
      const overlay = document.getElementById('shortcuts-help-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay!.style.display).toBe('flex');
    });

    it('hides help overlay on second press', () => {
      KS.init({});
      pressKey('?');
      pressKey('?');
      expect(KS.helpVisible).toBe(false);
      const overlay = document.getElementById('shortcuts-help-overlay');
      expect(overlay!.style.display).toBe('none');
    });
  });

  describe('ESC key', () => {
    it('closes modals via closeModal()', () => {
      const closeModalFn = vi.fn();
      (window as any).closeModal = closeModalFn;

      document.body.innerHTML = '<div class="modal-overlay" id="test-modal" style="display:block;"></div>';
      KS.init({});
      pressKey('Escape');
      expect(closeModalFn).toHaveBeenCalledWith('test-modal');
    });

    it('closes GlobalSearch', () => {
      const closeSpy = vi.fn();
      (window as any).GlobalSearch = { close: closeSpy };
      KS.init({});
      pressKey('Escape');
      expect(closeSpy).toHaveBeenCalled();
    });

    it('hides help if visible', () => {
      KS.init({});
      KS.helpVisible = true;
      KS.showHelp();
      pressKey('Escape');
      expect(KS.helpVisible).toBe(false);
    });
  });

  describe('typing in input/textarea is ignored', () => {
    it('does not fire custom shortcuts when typing in input', () => {
      const handler = vi.fn();
      KS.init({ n: handler });
      const input = document.createElement('input');
      document.body.appendChild(input);
      pressKey('n', {}, input);
      expect(handler).not.toHaveBeenCalled();
    });

    it('does not fire custom shortcuts when typing in textarea', () => {
      const handler = vi.fn();
      KS.init({ n: handler });
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      pressKey('n', {}, textarea);
      expect(handler).not.toHaveBeenCalled();
    });

    it('ESC blurs the focused input', () => {
      KS.init({});
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      const blurSpy = vi.spyOn(input, 'blur');
      pressKey('Escape', {}, input);
      expect(blurSpy).toHaveBeenCalled();
    });
  });

  describe('showHelp / hideHelp', () => {
    it('showHelp creates overlay with shortcuts content', () => {
      KS.init({ n: Object.assign(vi.fn(), { _description: 'New lead' }) });
      KS.showHelp();
      const overlay = document.getElementById('shortcuts-help-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay!.innerHTML).toContain('Keyboard Shortcuts');
      expect(overlay!.innerHTML).toContain('Suche öffnen');
      expect(overlay!.innerHTML).toContain('New lead');
      expect(KS.helpVisible).toBe(true);
    });

    it('hideHelp hides the overlay', () => {
      KS.init({});
      KS.showHelp();
      KS.hideHelp();
      const overlay = document.getElementById('shortcuts-help-overlay');
      expect(overlay!.style.display).toBe('none');
      expect(KS.helpVisible).toBe(false);
    });
  });
});
