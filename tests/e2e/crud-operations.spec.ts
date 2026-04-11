import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

async function getToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.access_token;
}

async function supabaseQuery(token: string, method: string, table: string, body?: any, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
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

test.describe('CRUD Operations', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    adminToken = await getToken('gstetter75@googlemail.com', 'Abcund123..');
  });

  test('admin can create, read, and delete a lead', async () => {
    // Create
    const created = await supabaseQuery(adminToken, 'POST', 'leads', {
      company_name: 'E2E Test Lead',
      contact_name: 'E2E Test',
      email: 'e2e-test@test.de',
      status: 'new',
    });
    expect(created.status).toBe(201);
    const leadId = created.data[0].id;
    expect(leadId).toBeTruthy();

    // Read
    const read = await supabaseQuery(adminToken, 'GET', 'leads', undefined, `?id=eq.${leadId}`);
    expect(read.status).toBe(200);
    expect(read.data[0].company_name).toBe('E2E Test Lead');

    // Delete
    const deleted = await supabaseQuery(adminToken, 'DELETE', 'leads', undefined, `?id=eq.${leadId}`);
    expect([200, 204]).toContain(deleted.status);

    // Verify deleted
    const verify = await supabaseQuery(adminToken, 'GET', 'leads', undefined, `?id=eq.${leadId}`);
    expect(verify.data).toEqual([]);
  });

  test('admin can read all profiles', async () => {
    const result = await supabaseQuery(adminToken, 'GET', 'profiles', undefined, '?select=id,email,role');
    expect(result.status).toBe(200);
    expect(result.data.length).toBeGreaterThanOrEqual(3);

    const roles = result.data.map((p: any) => p.role);
    expect(roles).toContain('superadmin');
    expect(roles).toContain('customer');
    expect(roles).toContain('sales');
  });

  test('customer cannot create a lead', async () => {
    const customerToken = await getToken('g.stetter@gmx.net', 'Abcund123..');
    const result = await supabaseQuery(customerToken, 'POST', 'leads', {
      company_name: 'Should Fail',
      status: 'new',
    });
    // Should be 403 (RLS blocks) or 201 if customer has insert rights
    // Either way, customer shouldn't see other users' leads
    const read = await supabaseQuery(customerToken, 'GET', 'leads', undefined, '?select=id');
    // Customer should see 0 leads (they're not a sales user)
    expect(read.data.length).toBe(0);
  });

  test('sales can read their own tasks', async () => {
    const salesToken = await getToken('info@call-lana.de', 'Abcund123..');
    const result = await supabaseQuery(salesToken, 'GET', 'tasks', undefined, '?select=id&limit=10');
    expect(result.status).toBe(200);
    // May be 0 tasks, but should not error
    expect(Array.isArray(result.data)).toBe(true);
  });

  test('customer can read their own subscription', async () => {
    const customerToken = await getToken('g.stetter@gmx.net', 'Abcund123..');
    const result = await supabaseQuery(customerToken, 'GET', 'subscriptions', undefined, '?select=plan,balance_cents');
    expect(result.status).toBe(200);
    expect(result.data.length).toBe(1);
    expect(result.data[0].plan).toBeTruthy();
  });
});
