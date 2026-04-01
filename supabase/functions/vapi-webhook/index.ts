// VAPI Webhook Handler — Processes call events from VAPI
// Events: call.started, call.ended, call.transferred, transcript.ready
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS uses '*' intentionally: this endpoint receives server-to-server webhook
// calls from VAPI, not browser requests. Authentication is handled via
// x-vapi-secret header verification (see VAPI_WEBHOOK_SECRET check below).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vapi-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify VAPI webhook secret
    const vapiSecret = Deno.env.get('VAPI_WEBHOOK_SECRET');
    if (vapiSecret) {
      const requestSecret = req.headers.get('x-vapi-secret');
      if (requestSecret !== vapiSecret) {
        return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const payload = await req.json();
    const event = payload.type || payload.event;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extract call ID — the stable identifier across all VAPI events
    const vapiCallId = payload.call?.id || payload.call_id;

    switch (event) {
      case 'call.started':
      case 'call-started': {
        const { call } = payload;
        if (!call || !vapiCallId) break;

        // Find user by assistant's phone number
        const phoneNumber = call.phoneNumber?.number || call.to;
        const { data: assistant } = await supabase
          .from('assistants')
          .select('user_id')
          .eq('phone_number', phoneNumber)
          .single();

        if (assistant) {
          await supabase.from('calls').insert({
            vapi_call_id: vapiCallId,
            user_id: assistant.user_id,
            phone_number: call.customer?.number || call.from || 'Unbekannt',
            caller_name: call.customer?.name || null,
            status: 'in_progress',
            created_at: new Date().toISOString(),
          });
        }
        break;
      }

      case 'call.ended':
      case 'call-ended': {
        if (!vapiCallId) break;
        const { call } = payload;

        const duration = call?.duration || (call?.startedAt
          ? Math.round((Date.now() - new Date(call.startedAt).getTime()) / 1000)
          : null);

        await supabase
          .from('calls')
          .update({
            status: 'completed',
            duration,
            outcome: call?.endedReason === 'customer-ended-call' ? 'info' : call?.outcome || null,
          })
          .eq('vapi_call_id', vapiCallId);
        break;
      }

      case 'transcript.ready':
      case 'transcript': {
        const { transcript } = payload;
        if (!vapiCallId || !transcript) break;

        await supabase
          .from('calls')
          .update({
            transcript: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
            sentiment_score: payload.sentimentScore || null,
          })
          .eq('vapi_call_id', vapiCallId);
        break;
      }

      case 'call.transferred':
      case 'transfer': {
        if (!vapiCallId) break;

        await supabase
          .from('calls')
          .update({
            outcome: 'weiterleitung',
            status: 'completed',
          })
          .eq('vapi_call_id', vapiCallId);
        break;
      }

      default:
        console.log(`Unhandled VAPI event: ${event}`);
    }

    return new Response(JSON.stringify({ success: true, event }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('VAPI webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
