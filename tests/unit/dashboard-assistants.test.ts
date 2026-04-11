import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('dashboard-assistants', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="homeAssistants"></div>
      <div id="assistantsListBody"></div>
      <div id="phonesListBody"></div>
      <div id="phonesCount"></div>
      <button id="btnNewAssistant"></button>
      <button id="btnSaveAssistant"></button>
      <div id="editTitle"></div>
      <div id="editDesc"></div>
      <input id="edName" value="" />
      <select id="edVoice"><option value="Marie">Marie</option></select>
      <select id="edLang"><option value="de">de</option></select>
      <input id="edPhone" value="" />
      <textarea id="edGreeting"></textarea>
      <select id="edModel"><option value="gpt-4">gpt-4</option></select>
      <input id="edTemp" value="0.7" />
      <input id="edMaxDuration" value="300" />
      <input id="edToolCalendar" type="checkbox" />
      <input id="edToolCRM" type="checkbox" />
      <input id="edToolEmail" type="checkbox" />
      <input id="edToolKB" type="checkbox" />
      <input id="edPostSummary" type="checkbox" />
      <input id="edPostTranscript" type="checkbox" />
      <input id="edPostSentiment" type="checkbox" />
      <input id="edOutboundEnabled" type="checkbox" />
      <input id="edOutboundMax" value="1" />
      <input id="edOutboundFrom" value="09:00" />
      <input id="edOutboundTo" value="18:00" />
    `;

    mocks = setupGlobalMocks();

    (window as any).assistantsList = [];
    (window as any).editingAssistantId = null;
    (window as any).escHtml = (s: string) => String(s ?? '');
    (window as any).showToast = vi.fn();
    (window as any).navigateToPage = vi.fn();
    (window as any).clanaDB = {
      getAssistants: vi.fn().mockResolvedValue({ success: true, data: [] }),
      createAssistant: vi.fn().mockResolvedValue({ success: true }),
      updateAssistant: vi.fn().mockResolvedValue({ success: true }),
      deleteAssistant: vi.fn().mockResolvedValue({ success: true }),
    };

    loadBrowserScript('js/dashboard-assistants.js');
  });

  describe('window globals', () => {
    it('exposes renderHomeAssistants', () => {
      expect(typeof (window as any).renderHomeAssistants).toBe('function');
    });

    it('exposes loadAssistants', () => {
      expect(typeof (window as any).loadAssistants).toBe('function');
    });

    it('exposes createNewAssistant', () => {
      expect(typeof (window as any).createNewAssistant).toBe('function');
    });

    it('exposes renderAssistantsList', () => {
      expect(typeof (window as any).renderAssistantsList).toBe('function');
    });

    it('exposes deleteAssistant', () => {
      expect(typeof (window as any).deleteAssistant).toBe('function');
    });
  });

  describe('renderHomeAssistants', () => {
    it('shows create card when no assistants', () => {
      (window as any).assistantsList = [];
      (window as any).renderHomeAssistants();
      const container = document.getElementById('homeAssistants')!;
      expect(container.innerHTML).toContain('Neuen Assistenten erstellen');
    });

    it('renders assistant cards when assistants exist', () => {
      (window as any).assistantsList = [
        { id: 'a1', name: 'Bot A', status: 'live', phone_number: '+49111' },
      ];
      (window as any).renderHomeAssistants();
      const container = document.getElementById('homeAssistants')!;
      expect(container.innerHTML).toContain('Bot A');
      expect(container.innerHTML).toContain('LIVE');
    });
  });

  describe('loadAssistants', () => {
    it('populates assistantsList from clanaDB', async () => {
      const assistants = [{ id: 'a1', name: 'Bot A', status: 'live', created_at: '2025-01-01' }];
      (window as any).clanaDB.getAssistants.mockResolvedValue({ success: true, data: assistants });

      await (window as any).loadAssistants();

      expect((window as any).assistantsList).toEqual(assistants);
    });

    it('sets empty array on failure', async () => {
      (window as any).clanaDB.getAssistants.mockResolvedValue({ success: false, data: [] });

      await (window as any).loadAssistants();

      expect((window as any).assistantsList).toEqual([]);
    });
  });

  describe('createNewAssistant', () => {
    it('resets editingAssistantId to null', () => {
      (window as any).editingAssistantId = 'old-id';
      (window as any).createNewAssistant();
      expect((window as any).editingAssistantId).toBeNull();
    });

    it('sets editor title to "Neuer Assistent"', () => {
      (window as any).createNewAssistant();
      expect(document.getElementById('editTitle')!.textContent).toBe('Neuer Assistent');
    });

    it('navigates to assistant-edit page', () => {
      (window as any).createNewAssistant();
      expect((window as any).navigateToPage).toHaveBeenCalledWith('assistant-edit');
    });
  });

  describe('renderAssistantsList', () => {
    it('shows empty state when no assistants', () => {
      (window as any).assistantsList = [];
      (window as any).renderAssistantsList();
      const container = document.getElementById('assistantsListBody')!;
      expect(container.innerHTML).toContain('Keine Assistenten');
    });

    it('renders table with assistant data', () => {
      (window as any).assistantsList = [
        { id: 'a1', name: 'Bot A', status: 'live', phone_number: '+49111', voice: 'Marie', created_at: '2025-01-01' },
      ];
      (window as any).renderAssistantsList();
      const container = document.getElementById('assistantsListBody')!;
      expect(container.innerHTML).toContain('Bot A');
      expect(container.innerHTML).toContain('+49111');
    });
  });
});
