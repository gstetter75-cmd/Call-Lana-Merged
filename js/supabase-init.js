// Supabase Client Initialization
const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
