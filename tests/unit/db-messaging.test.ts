import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('dbMessaging', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    sessionStorage.clear();
    loadBrowserScript('js/db/messaging.js');
  });

  // ====== Availability ======

  describe('getAvailability', () => {
    it('returns availability entries', async () => {
      const entries = [{ id: 'av1', date: '2025-03-01', user_id: 'u-1' }];
      const qm = createQueryMock(entries);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbMessaging.getAvailability();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(entries);
      expect(mocks.supabase.from).toHaveBeenCalledWith('availability');
    });

    it('applies userId filter', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbMessaging.getAvailability('u-1');

      expect(qm.eq).toHaveBeenCalledWith('user_id', 'u-1');
    });

    it('applies startDate and endDate filters', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbMessaging.getAvailability(null, '2025-01-01', '2025-01-31');

      expect(qm.gte).toHaveBeenCalledWith('date', '2025-01-01');
      expect(qm.lte).toHaveBeenCalledWith('date', '2025-01-31');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbMessaging.getAvailability();

      expect(result.success).toBe(false);
    });
  });

  describe('setAvailability', () => {
    it('inserts availability with user_id', async () => {
      const entry = { id: 'av-new', date: '2025-03-15', user_id: 'test-uid' };
      const qm = createQueryMock(entry);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbMessaging.setAvailability({ date: '2025-03-15', status: 'available' });

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('availability');
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: 'test-uid', date: '2025-03-15', status: 'available' }),
      ]);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbMessaging.setAvailability({});

      expect(result.success).toBe(false);
    });
  });

  describe('deleteAvailability', () => {
    it('deletes availability entry', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbMessaging.deleteAvailability('av1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('availability');
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.eq).toHaveBeenCalledWith('id', 'av1');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbMessaging.deleteAvailability('av1');

      expect(result.success).toBe(false);
    });
  });

  // ====== Conversations ======

  describe('getConversations', () => {
    it('returns conversations with participants', async () => {
      const convs = [{ id: 'c1', subject: 'Test', conversation_participants: [] }];
      const qm = createQueryMock(convs);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbMessaging.getConversations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(convs);
      expect(mocks.supabase.from).toHaveBeenCalledWith('conversations');
      expect(qm.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbMessaging.getConversations();

      expect(result.success).toBe(false);
    });
  });

  // ====== Messages ======

  describe('getMessages', () => {
    it('returns messages for a conversation', async () => {
      const msgs = [{ id: 'm1', content: 'Hi' }, { id: 'm2', content: 'Hello' }];
      const qm = createQueryMock(msgs);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbMessaging.getMessages('c1', 50);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(msgs);
      expect(mocks.supabase.from).toHaveBeenCalledWith('messages');
      expect(qm.eq).toHaveBeenCalledWith('conversation_id', 'c1');
      expect(qm.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(qm.limit).toHaveBeenCalledWith(50);
    });

    it('defaults limit to 100', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbMessaging.getMessages('c1');

      expect(qm.limit).toHaveBeenCalledWith(100);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbMessaging.getMessages('c1');

      expect(result.success).toBe(false);
    });
  });

  // ====== createConversation ======

  describe('createConversation', () => {
    it('creates conversation and adds participants (deduplicated)', async () => {
      const conv = { id: 'c-new', subject: 'Topic', type: 'direct' };
      const qm = createQueryMock(conv);
      mocks.supabase.from.mockReturnValue(qm);

      // Include current user in participant list to test deduplication
      const result = await (window as any).dbMessaging.createConversation(
        ['test-uid', 'other-uid'],
        'Topic',
        'direct'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(conv);

      // conversations insert
      expect(mocks.supabase.from).toHaveBeenCalledWith('conversations');
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({ created_by: 'test-uid', subject: 'Topic', type: 'direct' }),
      ]);

      // conversation_participants insert (deduplicated: test-uid + other-uid)
      expect(mocks.supabase.from).toHaveBeenCalledWith('conversation_participants');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbMessaging.createConversation(['u-1'], 'Sub');

      expect(result.success).toBe(false);
    });
  });

  // ====== sendMessage ======

  describe('sendMessage', () => {
    it('inserts message and updates conversation timestamp', async () => {
      const msg = { id: 'm-new', content: 'Hello', sender_id: 'test-uid' };
      const qm = createQueryMock(msg);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbMessaging.sendMessage('c1', 'Hello');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(msg);

      // messages insert
      expect(mocks.supabase.from).toHaveBeenCalledWith('messages');
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({ conversation_id: 'c1', sender_id: 'test-uid', content: 'Hello' }),
      ]);

      // conversation update
      expect(mocks.supabase.from).toHaveBeenCalledWith('conversations');
      expect(qm.update).toHaveBeenCalledWith(expect.objectContaining({ updated_at: expect.any(String) }));
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbMessaging.sendMessage('c1', 'Hi');

      expect(result.success).toBe(false);
    });
  });

  // ====== markConversationRead ======

  describe('markConversationRead', () => {
    it('updates last_read_at for current user', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbMessaging.markConversationRead('c1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('conversation_participants');
      expect(qm.update).toHaveBeenCalledWith(expect.objectContaining({ last_read_at: expect.any(String) }));
      expect(qm.eq).toHaveBeenCalledWith('conversation_id', 'c1');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'test-uid');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbMessaging.markConversationRead('c1');

      expect(result.success).toBe(false);
    });
  });

  // ====== submitContactForm ======

  describe('submitContactForm', () => {
    it('submits valid form data as lead', async () => {
      const lead = { id: 'l-new', company_name: 'Test Co', email: 'test@test.de' };
      const qm = createQueryMock(lead);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbMessaging.submitContactForm({
        name: 'Max Muster',
        email: 'max@muster.de',
        company: 'Muster GmbH',
        phone: '+49123456',
        message: 'Interested in product',
      });

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('leads');
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          company_name: 'Muster GmbH',
          contact_name: 'Max Muster',
          email: 'max@muster.de',
          phone: '+49123456',
          source: 'website',
          notes: 'Interested in product',
          status: 'new',
        }),
      ]);
    });

    it('validates name is required (min 2 chars)', async () => {
      const result = await (window as any).dbMessaging.submitContactForm({
        name: 'A',
        email: 'valid@test.de',
      });

      expect(result.success).toBe(false);
    });

    it('validates email is required and valid', async () => {
      const result = await (window as any).dbMessaging.submitContactForm({
        name: 'Max Muster',
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
    });

    it('rate limits submissions via sessionStorage', async () => {
      const qm = createQueryMock({ id: 'l1' });
      mocks.supabase.from.mockReturnValue(qm);

      // First submission succeeds
      const first = await (window as any).dbMessaging.submitContactForm({
        name: 'Max Muster',
        email: 'max@muster.de',
      });
      expect(first.success).toBe(true);

      // Second submission within 30s fails
      const second = await (window as any).dbMessaging.submitContactForm({
        name: 'Max Muster',
        email: 'max@muster.de',
      });
      expect(second.success).toBe(false);
    });
  });
});
