// Send WhatsApp Notification — Appointment confirmation via Meta Cloud API
//
// Required env vars:
//   WHATSAPP_TOKEN      — Meta WhatsApp Business API bearer token
//   WHATSAPP_PHONE_ID   — WhatsApp Business phone number ID

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentPayload {
  customerPhone: string;
  customerName: string;
  companyName: string;
  date: string;   // e.g. "15.04.2026"
  time: string;   // e.g. "14:00"
}

function validatePayload(body: unknown): AppointmentPayload {
  const data = body as Record<string, unknown>;

  const required = ['customerPhone', 'customerName', 'companyName', 'date', 'time'] as const;
  const missing = required.filter((key) => !data[key] || typeof data[key] !== 'string');

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  const phone = String(data.customerPhone).replace(/[^0-9+]/g, '');
  if (phone.length < 10) {
    throw new Error('Invalid phone number format');
  }

  return {
    customerPhone: phone,
    customerName: String(data.customerName),
    companyName: String(data.companyName),
    date: String(data.date),
    time: String(data.time),
  };
}

function buildMessageBody(payload: AppointmentPayload): string {
  return [
    `Hallo ${payload.customerName}!`,
    `Ihr Termin bei ${payload.companyName} wurde bestaetigt:`,
    `${payload.date} um ${payload.time}`,
    '',
    'Falls Sie absagen moechten, antworten Sie mit "ABSAGEN".',
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');
    const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');

    if (!whatsappToken || !phoneId) {
      console.error('WhatsApp env vars not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const rawBody = await req.json();
    const payload = validatePayload(rawBody);
    const messageText = buildMessageBody(payload);

    // TODO: Activate once Meta Business verification is complete.
    // The API call below is structurally correct but will fail without
    // a verified WhatsApp Business Account and approved message template.
    //
    // const apiUrl = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    // const response = await fetch(apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${whatsappToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     recipient_type: 'individual',
    //     to: payload.customerPhone,
    //     type: 'text',
    //     text: { preview_url: false, body: messageText },
    //   }),
    // });
    //
    // if (!response.ok) {
    //   const errText = await response.text();
    //   throw new Error(`WhatsApp API error: ${errText}`);
    // }
    //
    // const result = await response.json();

    console.log('WhatsApp notification prepared (API call disabled):', {
      to: payload.customerPhone,
      message: messageText,
    });

    return new Response(
      JSON.stringify({
        success: true,
        note: 'WhatsApp API call is currently disabled (TODO: enable after Meta verification)',
        message: messageText,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('WhatsApp notification error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
