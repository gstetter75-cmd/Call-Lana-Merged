#!/usr/bin/env node
// ==========================================
// Cleanup: Remove test data created by seed-test-data.js
// Run: node scripts/cleanup-test-data.js
// ==========================================

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

async function getToken(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await res.json()).access_token;
}

async function del(token, table, filter = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filter}`, {
    method: 'DELETE',
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
  });
  console.log(`  ${res.ok ? '✅' : '❌'} ${table} ${filter || '(all accessible)'}`);
}

async function run() {
  console.log('\n🧹 Cleaning up test data...\n');

  const adminToken = await getToken('gstetter75@googlemail.com', 'Abcund123..');
  const salesToken = await getToken('info@call-lana.de', 'Abcund123..');
  const customerToken = await getToken('g.stetter@gmx.net', 'Abcund123..');

  console.log('── Sales Data ──');
  await del(salesToken, 'tasks', '?assigned_to=eq.' + (await getUserId(salesToken)));
  await del(salesToken, 'leads', '?assigned_to=eq.' + (await getUserId(salesToken)));

  console.log('\n── Customer Data ──');
  const custId = await getUserId(customerToken);
  await del(customerToken, 'calls', '?user_id=eq.' + custId);
  await del(customerToken, 'assistants', '?user_id=eq.' + custId);

  console.log('\n✅ Cleanup complete!\n');
}

async function getUserId(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
  });
  return (await res.json()).id;
}

run().catch(err => { console.error('Cleanup failed:', err); process.exit(1); });
