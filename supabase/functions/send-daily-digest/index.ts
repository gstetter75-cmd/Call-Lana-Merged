// Send Daily Digest — Summary email of today's activity
// Triggered by Supabase cron (pg_cron) or external scheduler at 18:00 daily
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildEmailHtml(stats: {
  date: string;
  callCount: number;
  totalDurationMin: number;
  appointmentCount: number;
  newLeadCount: number;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#7c3aed;margin:0;">Call Lana</h1>
        <p style="color:#666;margin:4px 0 0;">Dein täglicher Bericht</p>
      </div>
      <h2 style="color:#1a1a2e;">Tagesbericht — ${stats.date}</h2>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 0;font-weight:600;">Anrufe heute</td>
          <td style="padding:12px 0;text-align:right;font-size:20px;color:#7c3aed;">${stats.callCount}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 0;font-weight:600;">Gesamtdauer</td>
          <td style="padding:12px 0;text-align:right;font-size:20px;color:#7c3aed;">${stats.totalDurationMin} min</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 0;font-weight:600;">Termine</td>
          <td style="padding:12px 0;text-align:right;font-size:20px;color:#7c3aed;">${stats.appointmentCount}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-weight:600;">Neue Leads</td>
          <td style="padding:12px 0;text-align:right;font-size:20px;color:#7c3aed;">${stats.newLeadCount}</td>
        </tr>
      </table>
      <div style="text-align:center;margin:30px 0;">
        <a href="https://call-lana.de/dashboard.html" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;">Dashboard öffnen</a>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      <p style="color:#999;font-size:11px;text-align:center;">Call Lana GmbH · Wetzellplatz 2 · 31137 Hildesheim</p>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const dateFormatted = formatDate(today);

    // Query today's calls
    const { data: calls, error: callsErr } = await supabase
      .from('calls')
      .select('id, duration')
      .gte('created_at', `${todayStr}T00:00:00`)
      .lt('created_at', `${todayStr}T23:59:59`);

    if (callsErr) throw new Error(`Calls query failed: ${callsErr.message}`);

    const callCount = calls?.length ?? 0;
    const totalDurationSec = (calls ?? []).reduce((sum, c) => sum + (c.duration || 0), 0);
    const totalDurationMin = Math.round(totalDurationSec / 60);

    // Query today's appointments
    const { count: appointmentCount, error: apptErr } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${todayStr}T00:00:00`)
      .lt('created_at', `${todayStr}T23:59:59`);

    if (apptErr) throw new Error(`Appointments query failed: ${apptErr.message}`);

    // Query new leads today
    const { count: newLeadCount, error: leadsErr } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${todayStr}T00:00:00`)
      .lt('created_at', `${todayStr}T23:59:59`);

    if (leadsErr) throw new Error(`Leads query failed: ${leadsErr.message}`);

    // Determine recipients from request body or default to admin
    const body = await req.json().catch(() => ({}));
    const recipients: string[] = body.recipients ?? [];
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipients provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = buildEmailHtml({
      date: dateFormatted,
      callCount,
      totalDurationMin,
      appointmentCount: appointmentCount ?? 0,
      newLeadCount: newLeadCount ?? 0,
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Call Lana <noreply@call-lana.de>',
        to: recipients,
        subject: `Call Lana — Dein Tagesbericht für ${dateFormatted}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Resend API error: ${err}`);
    }

    return new Response(JSON.stringify({
      success: true,
      stats: { callCount, totalDurationMin, appointmentCount: appointmentCount ?? 0, newLeadCount: newLeadCount ?? 0 },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
