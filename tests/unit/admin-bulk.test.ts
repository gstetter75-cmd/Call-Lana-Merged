import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('AdminBulk', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();

    document.body.innerHTML = `
      <div id="tab-users">
        <table class="data-table">
          <thead><tr><th>Name</th></tr></thead>
          <tbody id="users-tbody">
            <tr data-id="u1"><td>User 1</td></tr>
            <tr data-id="u2"><td>User 2</td></tr>
          </tbody>
        </table>
      </div>
      <div id="tab-customers">
        <table class="data-table">
          <thead><tr><th>Name</th></tr></thead>
          <tbody id="customers-tbody">
            <tr data-id="c1"><td>Customer 1</td></tr>
          </tbody>
        </table>
      </div>
    `;

    loadBrowserScript('js/admin-bulk.js');
  });

  it('AdminBulk is defined on window', () => {
    expect((window as any).AdminBulk).toBeDefined();
  });

  it('has init method', () => {
    expect(typeof (window as any).AdminBulk.init).toBe('function');
  });

  it('has toggleOne method', () => {
    expect(typeof (window as any).AdminBulk.toggleOne).toBe('function');
  });

  it('has toggleAll method', () => {
    expect(typeof (window as any).AdminBulk.toggleAll).toBe('function');
  });

  it('has clearSelection method', () => {
    expect(typeof (window as any).AdminBulk.clearSelection).toBe('function');
  });

  it('has bulkAction method', () => {
    expect(typeof (window as any).AdminBulk.bulkAction).toBe('function');
  });

  describe('toggleOne()', () => {
    it('adds id to selectedIds when checked', () => {
      const bulk = (window as any).AdminBulk;
      bulk.tableType = 'users';
      bulk.selectedIds.clear();
      bulk.toggleOne('u1', true);
      expect(bulk.selectedIds.has('u1')).toBe(true);
      expect(bulk.selectedIds.size).toBe(1);
    });

    it('removes id from selectedIds when unchecked', () => {
      const bulk = (window as any).AdminBulk;
      bulk.tableType = 'users';
      bulk.selectedIds.clear();
      bulk.selectedIds.add('u1');
      bulk.toggleOne('u1', false);
      expect(bulk.selectedIds.has('u1')).toBe(false);
      expect(bulk.selectedIds.size).toBe(0);
    });

    it('can add multiple ids', () => {
      const bulk = (window as any).AdminBulk;
      bulk.tableType = 'users';
      bulk.selectedIds.clear();
      bulk.toggleOne('u1', true);
      bulk.toggleOne('u2', true);
      expect(bulk.selectedIds.size).toBe(2);
      expect(bulk.selectedIds.has('u1')).toBe(true);
      expect(bulk.selectedIds.has('u2')).toBe(true);
    });
  });

  describe('clearSelection()', () => {
    it('empties the selectedIds set', () => {
      const bulk = (window as any).AdminBulk;
      bulk.tableType = 'users';
      bulk.selectedIds.add('u1');
      bulk.selectedIds.add('u2');
      expect(bulk.selectedIds.size).toBe(2);
      bulk.clearSelection();
      expect(bulk.selectedIds.size).toBe(0);
    });

    it('unchecks all checkboxes', () => {
      const bulk = (window as any).AdminBulk;
      bulk.tableType = 'users';

      // Create some checkbox elements
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'bulk-cb';
      cb.checked = true;
      document.body.appendChild(cb);

      bulk.clearSelection();
      expect(cb.checked).toBe(false);
    });
  });

  describe('init()', () => {
    it('clears selectedIds and sets tableType', () => {
      const bulk = (window as any).AdminBulk;
      bulk.selectedIds.add('old-id');
      bulk.init('users', 'users-tbody');
      expect(bulk.tableType).toBe('users');
      expect(bulk.selectedIds.size).toBe(0);
    });

    it('injects toolbar for table type', () => {
      const bulk = (window as any).AdminBulk;
      bulk.init('users', 'users-tbody');
      const toolbar = document.getElementById('bulk-toolbar-users');
      expect(toolbar).not.toBeNull();
      expect(toolbar!.innerHTML).toContain('ausgewählt');
    });
  });

  describe('_updateToolbar()', () => {
    it('shows toolbar when items selected', () => {
      const bulk = (window as any).AdminBulk;
      bulk.init('users', 'users-tbody');
      bulk.toggleOne('u1', true);
      const toolbar = document.getElementById('bulk-toolbar-users');
      expect(toolbar!.style.display).toBe('flex');
    });

    it('hides toolbar when no items selected', () => {
      const bulk = (window as any).AdminBulk;
      bulk.init('users', 'users-tbody');
      bulk.toggleOne('u1', true);
      bulk.toggleOne('u1', false);
      const toolbar = document.getElementById('bulk-toolbar-users');
      expect(toolbar!.style.display).toBe('none');
    });
  });
});
