import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

async function getToken(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { token: data.access_token, userId: data.user?.id };
}

async function query(token: string, method: string, path: string, body?: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

test.describe('Conversations', () => {
  let adminAuth: { token: string; userId: string };

  test.beforeAll(async () => {
    adminAuth = await getToken('gstetter75@googlemail.com', 'Abcund123..');
  });

  test('full conversation flow: create → participant → message → cleanup', async () => {
    // 1. Create conversation
    const conv = await query(adminAuth.token, 'POST', 'conversations', {
      subject: 'E2E Conversation Test',
      type: 'direct',
      created_by: adminAuth.userId,
    });
    expect(conv.status).toBe(201);
    const convId = conv.data[0].id;

    // 2. Add self as participant
    const part = await query(adminAuth.token, 'POST', 'conversation_participants', {
      conversation_id: convId,
      user_id: adminAuth.userId,
    });
    expect([201, 200]).toContain(part.status);

    // 3. Send a message
    const msg = await query(adminAuth.token, 'POST', 'messages', {
      conversation_id: convId,
      sender_id: adminAuth.userId,
      content: 'Hello from E2E test!',
    });
    expect(msg.status).toBe(201);
    expect(msg.data[0].content).toBe('Hello from E2E test!');

    // 4. Read messages
    const msgs = await query(adminAuth.token, 'GET', `messages?conversation_id=eq.${convId}`);
    expect(msgs.status).toBe(200);
    expect(msgs.data.length).toBe(1);

    // 5. Cleanup
    await query(adminAuth.token, 'DELETE', `messages?conversation_id=eq.${convId}`);
    await query(adminAuth.token, 'DELETE', `conversation_participants?conversation_id=eq.${convId}`);
    await query(adminAuth.token, 'DELETE', `conversations?id=eq.${convId}`);
  });

  test('customer can read their own conversations', async () => {
    const customerAuth = await getToken('g.stetter@gmx.net', 'Abcund123..');
    expect(customerAuth.token).toBeTruthy();

    // Customer reads conversations (may be empty, but should not error)
    const convs = await query(customerAuth.token, 'GET', 'conversations?select=id,subject&limit=5');
    expect(convs.status).toBe(200);
    expect(Array.isArray(convs.data)).toBe(true);
  });
});
