// Supabase Edge Function: create-payment-method
// Tokenizes payment data via Stripe API.
// Raw card/IBAN data is sent directly to Stripe and NEVER stored in our database.
// Returns stripe_customer_id and stripe_payment_method_id for DB storage.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { rateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://call-lana.de',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STRIPE_API = 'https://api.stripe.com/v1'

async function stripeRequest(path: string, body: Record<string, string>) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit: 5 payment method creations per minute per user
    const rl = rateLimit(user.id, 5, 60_000)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, CORS_HEADERS)

    const payload = await req.json()

    // Get or create Stripe customer for this user
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: existingPm } = await serviceClient
      .from('payment_methods')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    let customerId = existingPm?.stripe_customer_id

    if (!customerId) {
      const customer = await stripeRequest('/customers', {
        email: user.email || '',
        'metadata[supabase_user_id]': user.id,
      })
      customerId = customer.id
    }

    // Create payment method based on type
    let paymentMethodId: string

    if (payload.type === 'card') {
      const [expMonth, expYearRaw] = (payload.expiry || '').split('/')
      if (!expMonth || !expYearRaw) {
        return new Response(JSON.stringify({ error: 'Invalid expiry format. Use MM/YY or MM/YYYY.' }), {
          status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }
      // Handle both "24" and "2024" formats
      const expYear = expYearRaw.trim().length === 4 ? expYearRaw.trim() : `20${expYearRaw.trim()}`

      if (!payload.number || !payload.cvc) {
        return new Response(JSON.stringify({ error: 'Card number and CVC are required.' }), {
          status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }

      const pm = await stripeRequest('/payment_methods', {
        type: 'card',
        'card[number]': payload.number,
        'card[exp_month]': expMonth.trim(),
        'card[exp_year]': expYear,
        'card[cvc]': payload.cvc,
        'billing_details[name]': payload.holder || '',
      })
      paymentMethodId = pm.id

      // Attach to customer
      await stripeRequest(`/payment_methods/${pm.id}/attach`, {
        customer: customerId,
      })
    } else if (payload.type === 'sepa_debit') {
      const iban = (payload.iban || '').replace(/\s/g, '').toUpperCase()
      if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) {
        return new Response(JSON.stringify({ error: 'Invalid IBAN format.' }), {
          status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }

      const pm = await stripeRequest('/payment_methods', {
        type: 'sepa_debit',
        'sepa_debit[iban]': iban,
        'billing_details[name]': payload.holder || '',
      })
      paymentMethodId = pm.id

      await stripeRequest(`/payment_methods/${pm.id}/attach`, {
        customer: customerId,
      })
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported payment type. Use "card" or "sepa_debit".' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      customer_id: customerId,
      payment_method_id: paymentMethodId,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('create-payment-method error:', err)
    const safeMsg = err.message?.includes('Invalid') || err.message?.includes('IBAN') || err.message?.includes('card')
      ? err.message
      : 'Zahlungsmethode konnte nicht gespeichert werden.'
    return new Response(JSON.stringify({ error: safeMsg }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
