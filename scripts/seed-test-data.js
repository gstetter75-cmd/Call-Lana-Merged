#!/usr/bin/env node
// ==========================================
// Seed Test Data: Creates sample leads, calls, tasks, assistants
// for the sales user (info@call-lana.de) and customer (g.stetter@gmx.net)
// Run: node scripts/seed-test-data.js
// ==========================================

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

async function getToken(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { token: data.access_token, userId: data.user?.id };
}

async function insert(token, table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(rows),
  });
  const data = await res.json();
  if (res.status >= 400) {
    console.error(`  ❌ ${table}: ${JSON.stringify(data).substring(0, 100)}`);
    return [];
  }
  console.log(`  ✅ ${table}: ${Array.isArray(data) ? data.length : 1} row(s)`);
  return Array.isArray(data) ? data : [data];
}

async function run() {
  console.log('\n🌱 Seeding test data...\n');

  // Login as sales user
  const sales = await getToken('info@call-lana.de', 'Abcund123..');
  if (!sales.token) { console.error('Sales login failed'); return; }
  console.log('📧 Sales: info@call-lana.de');

  // Login as customer
  const customer = await getToken('g.stetter@gmx.net', 'Abcund123..');
  if (!customer.token) { console.error('Customer login failed'); return; }
  console.log('📧 Customer: g.stetter@gmx.net\n');

  // --- Sales: Create leads ---
  console.log('── Sales Data ──');
  const leads = await insert(sales.token, 'leads', [
    { company_name: 'Müller Sanitär GmbH', contact_name: 'Hans Müller', email: 'mueller@sanitaer.de', phone: '+49 170 1234567', status: 'qualified', value: 299, industry: 'sanitaer', assigned_to: sales.userId },
    { company_name: 'Schmidt Elektro', contact_name: 'Peter Schmidt', email: 'schmidt@elektro.de', phone: '+49 171 2345678', status: 'contacted', value: 149, industry: 'elektro', assigned_to: sales.userId },
    { company_name: 'Weber Heizung & Klima', contact_name: 'Maria Weber', email: 'weber@heizung.de', phone: '+49 172 3456789', status: 'new', value: 599, industry: 'heizung', assigned_to: sales.userId },
    { company_name: 'Fischer Malerbetrieb', contact_name: 'Thomas Fischer', email: 'fischer@maler.de', phone: '+49 173 4567890', status: 'proposal', value: 299, industry: 'maler', assigned_to: sales.userId },
    { company_name: 'Wagner Dachdecker', contact_name: 'Klaus Wagner', email: 'wagner@dach.de', phone: '+49 174 5678901', status: 'won', value: 149, industry: 'dachdecker', assigned_to: sales.userId },
  ]);

  // --- Sales: Create tasks ---
  await insert(sales.token, 'tasks', [
    { title: 'Müller Sanitär anrufen', status: 'open', due_date: new Date(Date.now() + 86400000).toISOString(), priority: 'high', assigned_to: sales.userId },
    { title: 'Angebot für Weber erstellen', status: 'open', due_date: new Date(Date.now() + 172800000).toISOString(), priority: 'medium', assigned_to: sales.userId },
    { title: 'Fischer Follow-up', status: 'done', due_date: new Date(Date.now() - 86400000).toISOString(), priority: 'low', assigned_to: sales.userId },
  ]);

  // --- Customer: Create assistant ---
  console.log('\n── Customer Data ──');
  const assistants = await insert(customer.token, 'assistants', [
    { name: 'Lana', greeting: 'Guten Tag, hier ist Lana von Call Lana. Wie kann ich Ihnen helfen?', voice: 'Marie', language: 'de', user_id: customer.userId, status: 'active' },
  ]);

  // --- Customer: Create sample calls ---
  const now = Date.now();
  await insert(customer.token, 'calls', [
    { phone_number: '+49 170 1234567', duration: 180, status: 'completed', outcome: 'termin', sentiment_score: 8, user_id: customer.userId, created_at: new Date(now - 3600000).toISOString(), transcript: null },
    { phone_number: '+49 171 9876543', duration: 45, status: 'missed', outcome: null, sentiment_score: null, user_id: customer.userId, created_at: new Date(now - 7200000).toISOString(), transcript: null },
    { phone_number: '+49 172 5555555', duration: 120, status: 'completed', outcome: 'info', sentiment_score: 6, user_id: customer.userId, created_at: new Date(now - 86400000).toISOString(), transcript: null },
    { phone_number: '+49 173 4444444', duration: 300, status: 'completed', outcome: 'termin', sentiment_score: 9, user_id: customer.userId, created_at: new Date(now - 172800000).toISOString(), transcript: null },
    { phone_number: '+49 174 3333333', duration: 60, status: 'voicemail', outcome: null, sentiment_score: null, user_id: customer.userId, created_at: new Date(now - 259200000).toISOString(), transcript: null },
  ]);

  console.log('\n✅ Seed complete!\n');
}

run().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
