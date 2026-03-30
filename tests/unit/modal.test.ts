import { describe, it, expect, beforeEach } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Modal System', () => {
  beforeEach(() => {
    setupGlobalMocks();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    const modal = document.createElement('div');
    modal.id = 'test-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    document.body.appendChild(modal);

    const modal2 = document.createElement('div');
    modal2.id = 'test-modal-2';
    modal2.className = 'modal-overlay';
    modal2.style.display = 'none';
    document.body.appendChild(modal2);

    loadBrowserScript('js/modal.js');
  });

  describe('openModal()', () => {
    it('shows the modal element', () => {
      (window as any).openModal('test-modal');
      expect(document.getElementById('test-modal')!.style.display).toBe('flex');
    });

    it('adds active class', () => {
      (window as any).openModal('test-modal');
      expect(document.getElementById('test-modal')!.classList.contains('active')).toBe(true);
    });

    it('sets body overflow to hidden', () => {
      (window as any).openModal('test-modal');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does nothing for non-existent id', () => {
      expect(() => (window as any).openModal('nonexistent')).not.toThrow();
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  describe('closeModal()', () => {
    it('hides the modal element', () => {
      (window as any).openModal('test-modal');
      (window as any).closeModal('test-modal');
      expect(document.getElementById('test-modal')!.style.display).toBe('none');
    });

    it('removes active class', () => {
      (window as any).openModal('test-modal');
      (window as any).closeModal('test-modal');
      expect(document.getElementById('test-modal')!.classList.contains('active')).toBe(false);
    });

    it('restores body overflow when no other modals are active', () => {
      (window as any).openModal('test-modal');
      (window as any).closeModal('test-modal');
      expect(document.body.style.overflow).toBe('');
    });

    it('keeps body overflow hidden if another modal is still active', () => {
      (window as any).openModal('test-modal');
      (window as any).openModal('test-modal-2');
      (window as any).closeModal('test-modal');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does nothing for non-existent id', () => {
      expect(() => (window as any).closeModal('nonexistent')).not.toThrow();
    });
  });

  describe('ESC key', () => {
    it('closes the topmost active modal', () => {
      (window as any).openModal('test-modal');
      (window as any).openModal('test-modal-2');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(document.getElementById('test-modal-2')!.classList.contains('active')).toBe(false);
      expect(document.getElementById('test-modal')!.classList.contains('active')).toBe(true);
    });

    it('does nothing if no modals are open', () => {
      expect(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });
  });

  describe('overlay click', () => {
    it('closes modal when clicking on the overlay background', () => {
      (window as any).openModal('test-modal');
      const modal = document.getElementById('test-modal')!;

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: modal });
      document.dispatchEvent(clickEvent);

      expect(modal.classList.contains('active')).toBe(false);
    });

    it('does not close modal when clicking inside (not on overlay)', () => {
      (window as any).openModal('test-modal');
      const modal = document.getElementById('test-modal')!;
      const child = document.createElement('div');
      modal.appendChild(child);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: child });
      document.dispatchEvent(clickEvent);

      expect(modal.classList.contains('active')).toBe(true);
    });
  });
});
