// Supabase Edge Function: invite-sales-user
// Creates a new sales user. Only callable by superadmins.
// Creates auth user, profile (role=sales), and trial subscription.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://call-lana.de',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Nicht authentifiziert' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Create client with the caller's JWT to check their role
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Ungültiges Token' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Check if caller is superadmin (profiles.role is single source of truth)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Nur Admins dürfen Sales-User anlegen' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { email, password, firstName, lastName, company } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'E-Mail und Passwort sind Pflichtfelder' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Passwort muss mindestens 8 Zeichen lang sein' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Create auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName: firstName || '',
        lastName: lastName || '',
        company: company || '',
        role: 'sales',
      },
    })

    if (createError) {
      const msg = createError.message.includes('already been registered')
        ? 'Diese E-Mail ist bereits registriert'
        : createError.message
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Upsert profile with sales role (trigger may not have created it)
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email,
        role: 'sales',
        first_name: firstName || '',
        last_name: lastName || '',
        company: company || '',
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // Update auth metadata to include sales role
    await adminClient.auth.admin.updateUserById(newUser.user.id, {
      user_metadata: { ...newUser.user.user_metadata, role: 'sales' },
    })

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        role: 'sales',
        firstName,
        lastName,
      },
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('invite-sales-user error:', err)
    return new Response(JSON.stringify({ error: 'Interner Fehler beim Anlegen des Users' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
