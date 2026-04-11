import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('DashboardTeam', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    const ids = [
      'teamListBody', 'teamCount',
      'inviteEmail', 'inviteRole', 'modal-invite-member',
      'conversationsList', 'messageArea', 'messageInputArea', 'messageInput',
      'convSubject', 'convMessage', 'modal-new-conversation',
    ];
    document.body.innerHTML = ids.map(id => {
      if (['inviteEmail', 'convSubject', 'convMessage', 'messageInput'].includes(id)) {
        return `<input id="${id}" value="">`;
      }
      if (id === 'inviteRole') {
        return `<select id="${id}"><option value="member">Member</option><option value="admin">Admin</option></select>`;
      }
      return `<div id="${id}"></div>`;
    }).join('');

    mocks = setupGlobalMocks();

    (window as any).currentProfile = { organization_id: 'org-1' };
    (window as any).currentUser = { id: 'test-uid' };
    (window as any).currentConversationId = null;
    (window as any).showToast = vi.fn();
    (window as any).escHtml = (s: any) => {
      if (s == null) return '';
      const div = document.createElement('div');
      div.textContent = String(s);
      return div.innerHTML;
    };

    (window as any).clanaDB = {
      getOrganization: vi.fn().mockResolvedValue({ success: true, data: { organization_members: [] } }),
      getConversations: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getMessages: vi.fn().mockResolvedValue({ success: true, data: [] }),
      sendMessage: vi.fn().mockResolvedValue({ success: true }),
      createConversation: vi.fn().mockResolvedValue({ success: true, data: { id: 'conv-1' } }),
      markConversationRead: vi.fn().mockResolvedValue({ success: true }),
    };

    loadBrowserScript('js/dashboard-team.js');
  });

  it('exports loadTeam to window', () => {
    expect((window as any).loadTeam).toBeDefined();
    expect(typeof (window as any).loadTeam).toBe('function');
  });

  it('exports inviteTeamMember to window', () => {
    expect(typeof (window as any).inviteTeamMember).toBe('function');
  });

  it('exports sendInvite to window', () => {
    expect(typeof (window as any).sendInvite).toBe('function');
  });

  it('exports loadConversations to window', () => {
    expect(typeof (window as any).loadConversations).toBe('function');
  });

  it('exports sendMessage to window', () => {
    expect(typeof (window as any).sendMessage).toBe('function');
  });

  describe('loadTeam', () => {
    it('shows empty state when no organization', async () => {
      (window as any).currentProfile = { organization_id: null };
      await (window as any).loadTeam();
      expect(document.getElementById('teamListBody')!.innerHTML).toContain('Keine Organisation');
    });

    it('shows empty state when no members', async () => {
      (window as any).clanaDB.getOrganization.mockResolvedValue({
        success: true,
        data: { organization_members: [] },
      });

      await (window as any).loadTeam();
      expect(document.getElementById('teamListBody')!.innerHTML).toContain('Keine Teammitglieder');
    });

    it('renders team members with sanitized names', async () => {
      (window as any).clanaDB.getOrganization.mockResolvedValue({
        success: true,
        data: {
          organization_members: [
            {
              role_in_org: 'admin',
              created_at: '2025-01-01T00:00:00Z',
              profiles: { first_name: '<b>Evil</b>', last_name: 'User', email: 'evil@test.de' },
            },
          ],
        },
      });

      await (window as any).loadTeam();

      const body = document.getElementById('teamListBody')!;
      expect(body.innerHTML).toContain('evil@test.de');
      // XSS should be escaped
      expect(body.innerHTML).not.toContain('<b>Evil</b>');
    });
  });

  describe('sendInvite', () => {
    it('rejects invalid email', () => {
      (document.getElementById('inviteEmail') as HTMLInputElement).value = 'not-email';
      (window as any).sendInvite();
      expect((window as any).showToast).toHaveBeenCalledWith(expect.stringContaining('gueltige'), true);
    });

    it('sends valid invite', () => {
      (document.getElementById('inviteEmail') as HTMLInputElement).value = 'valid@test.de';
      (window as any).sendInvite();
      expect((window as any).showToast).toHaveBeenCalledWith(expect.stringContaining('valid@test.de'));
    });
  });
});
