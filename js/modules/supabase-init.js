// Supabase Client Initialization
// Note: window.supabase comes from CDN (@supabase/supabase-js@2)
const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
