import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('GlobalSearch', () => {
  let GS: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    document.body.innerHTML = '';
    loadBrowserScript('js/global-search.js');
    GS = (window as any).GlobalSearch;
    // Reset state
    GS.isOpen = false;
    GS.searchTimeout = null;
  });

  describe('init()', () => {
    it('creates overlay element in DOM', () => {
      GS.init();
      const overlay = document.getElementById('global-search-overlay');
      expect(overlay).not.toBeNull();
      // Overlay exists with correct id
      expect(overlay!.id).toBe('global-search-overlay');
    });

    it('does not create duplicate overlay', () => {
      GS.init();
      GS.init();
      const overlays = document.querySelectorAll('#global-search-overlay');
      expect(overlays).toHaveLength(1);
    });

    it('creates search input', () => {
      GS.init();
      const input = document.getElementById('global-search-input');
      expect(input).not.toBeNull();
    });
  });

  describe('open()', () => {
    it('shows overlay and sets isOpen=true', () => {
      GS.open();
      const overlay = document.getElementById('global-search-overlay');
      expect(overlay!.style.display).toBe('block');
      expect(GS.isOpen).toBe(true);
    });

    it('clears the input value', () => {
      GS.open();
      const input = document.getElementById('global-search-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('close()', () => {
    it('hides overlay and sets isOpen=false', () => {
      GS.open();
      GS.close();
      const overlay = document.getElementById('global-search-overlay');
      expect(overlay!.style.display).toBe('none');
      expect(GS.isOpen).toBe(false);
    });
  });

  describe('search()', () => {
    it('shows minimum message for queries < 2 chars', async () => {
      GS.open();
      await GS.search('a');
      const results = document.getElementById('global-search-results')!;
      expect(results.innerHTML).toContain('Mindestens 2 Zeichen');
    });

    it('shows minimum message for empty query', async () => {
      GS.open();
      await GS.search('');
      const results = document.getElementById('global-search-results')!;
      expect(results.innerHTML).toContain('Mindestens 2 Zeichen');
    });

    it('queries leads, customers, tasks via supabaseClient', async () => {
      GS.open();

      // Set up the mock to return data for all three queries
      const qm = createQueryMock([]);
      mocks.supabase.from = vi.fn().mockReturnValue(qm);

      await GS.search('test query');

      expect(mocks.supabase.from).toHaveBeenCalledWith('leads');
      expect(mocks.supabase.from).toHaveBeenCalledWith('customers');
      expect(mocks.supabase.from).toHaveBeenCalledWith('tasks');
    });

    it('shows "no results" when nothing found', async () => {
      GS.open();
      const qm = createQueryMock([]);
      mocks.supabase.from = vi.fn().mockReturnValue(qm);

      await GS.search('zzz');
      const results = document.getElementById('global-search-results')!;
      expect(results.innerHTML).toContain('Keine Ergebnisse');
    });
  });

  describe('renderSection()', () => {
    it('creates HTML with title and items', () => {
      const html = GS.renderSection('Leads', [
        { title: 'Acme Corp', subtitle: 'John Doe', badge: 'new', action: "alert('hi')", icon: '🎯' },
      ]);
      expect(html).toContain('Leads');
      expect(html).toContain('Acme Corp');
      expect(html).toContain('John Doe');
      expect(html).toContain('new');
      expect(html).toContain('🎯');
    });

    it('renders multiple items', () => {
      const html = GS.renderSection('Test', [
        { title: 'Item1', subtitle: '', badge: '', action: '', icon: '1' },
        { title: 'Item2', subtitle: '', badge: '', action: '', icon: '2' },
      ]);
      expect(html).toContain('Item1');
      expect(html).toContain('Item2');
    });
  });
});
