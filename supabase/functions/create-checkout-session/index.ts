// Create Stripe Checkout Session — For top-ups and plan upgrades
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { rateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://call-lana.de',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_ORIGINS = [
  'https://call-lana.de',
  'https://www.call-lana.de',
  Deno.env.get('ALLOWED_ORIGIN'),
].filter(Boolean);

const MIN_TOPUP_CENTS = 500;    // 5 EUR minimum
const MAX_TOPUP_CENTS = 50000;  // 500 EUR maximum

function validateRedirectUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    if (ALLOWED_ORIGINS.includes(parsed.origin)) return url;
  } catch { /* invalid URL */ }
  return fallback;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Rate limit: 5 checkout sessions per minute per user
    const rl = rateLimit(user.id, 5, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);

    const { mode, amount_cents, plan, success_url, cancel_url } = await req.json();

    // Validate redirect URLs against whitelist
    const baseUrl = Deno.env.get('ALLOWED_ORIGIN') || 'https://call-lana.de';
    const safeSuccessUrl = validateRedirectUrl(success_url, `${baseUrl}/dashboard.html?payment=success`);
    const safeCancelUrl = validateRedirectUrl(cancel_url, `${baseUrl}/dashboard.html?payment=cancelled`);

    // Validate top-up amount
    if (mode === 'topup') {
      const cents = Number(amount_cents);
      if (!Number.isInteger(cents) || cents < MIN_TOPUP_CENTS || cents > MAX_TOPUP_CENTS) {
        return new Response(JSON.stringify({
          error: `Betrag muss zwischen ${MIN_TOPUP_CENTS / 100}€ und ${MAX_TOPUP_CENTS / 100}€ liegen.`,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get or create Stripe customer
    const { data: sub } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    ).from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).single();

    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      ).from('subscriptions').update({ stripe_customer_id: customerId }).eq('user_id', user.id);
    }

    let session;

    if (mode === 'topup') {
      // One-time payment for balance top-up
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: 'Guthaben-Aufladung' },
            unit_amount: amount_cents || 5000,
          },
          quantity: 1,
        }],
        metadata: { user_id: user.id, type: 'topup' },
        success_url: safeSuccessUrl,
        cancel_url: safeCancelUrl,
      });
    } else if (mode === 'subscription') {
      // Plan upgrade/change
      const priceId = Deno.env.get(`STRIPE_PRICE_${(plan || 'starter').toUpperCase()}`);
      if (!priceId) throw new Error('Price not configured for plan: ' + plan);

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { user_id: user.id, plan: plan || 'starter' },
        success_url: safeSuccessUrl,
        cancel_url: safeCancelUrl,
      });
    } else {
      throw new Error('Invalid mode. Use "topup" or "subscription".');
    }

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Checkout session error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
