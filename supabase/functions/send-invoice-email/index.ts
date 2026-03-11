// ==========================================
// SEND INVOICE EMAIL — Supabase Edge Function
// Generates PDF (pdf-lib) and sends via Resend API.
// Supports single invoice or batch mode.
// ==========================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateInvoicePdf } from "./pdf-generator.ts";
import { invoiceEmailHtml, multiInvoiceEmailHtml } from "./email-template.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InvoiceRequest {
  invoice_id?: string;
  invoice_ids?: string[];
  batch?: boolean;
}

interface SendResult {
  invoice_id: string;
  invoice_number: string;
  success: boolean;
  error?: string;
}

/**
 * Create an authenticated Supabase client with service role key.
 * Bypasses RLS for server-side operations.
 */
function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Check whether the invoice owner has auto-email enabled in their settings.
 */
async function isAutoEmailEnabled(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("settings")
    .select("auto_invoice_email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load user settings:", error.message);
    return false;
  }

  return data?.auto_invoice_email === true;
}

/**
 * Load a single invoice with its items and global invoice_settings.
 */
async function loadInvoiceData(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string
) {
  const [invoiceRes, itemsRes, settingsRes] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", invoiceId).single(),
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("position", { ascending: true }),
    supabase.from("invoice_settings").select("*").limit(1).single(),
  ]);

  if (invoiceRes.error) throw new Error(`Invoice not found: ${invoiceRes.error.message}`);
  if (itemsRes.error) throw new Error(`Items error: ${itemsRes.error.message}`);
  if (settingsRes.error) throw new Error(`Settings error: ${settingsRes.error.message}`);

  return {
    invoice: invoiceRes.data,
    items: itemsRes.data ?? [],
    settings: settingsRes.data,
  };
}

interface EmailAttachment {
  filename: string;
  content: string; // base64
  content_type: string;
}

/**
 * Convert PDF bytes to a Resend-compatible attachment object.
 */
function pdfToAttachment(pdfBytes: Uint8Array, fileName: string): EmailAttachment {
  const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
  return {
    filename: fileName,
    content: pdfBase64,
    content_type: "application/pdf",
  };
}

/**
 * Send an email with one or more PDF attachments via Resend API.
 */
async function sendViaResend(
  to: string,
  subject: string,
  htmlBody: string,
  pdfBytes: Uint8Array,
  fileName: string
): Promise<void> {
  await sendViaResendMulti(to, subject, htmlBody, [
    pdfToAttachment(pdfBytes, fileName),
  ]);
}

/**
 * Send an email with multiple attachments via Resend API.
 */
async function sendViaResendMulti(
  to: string,
  subject: string,
  htmlBody: string,
  attachments: EmailAttachment[]
): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  const fromAddress =
    Deno.env.get("INVOICE_FROM_EMAIL") || "Call Lana <rechnung@call-lana.de>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      html: htmlBody,
      attachments,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
}

/**
 * Mark the invoice as sent in the database.
 */
async function markInvoiceSent(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string
): Promise<void> {
  const { error } = await supabase
    .from("invoices")
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      status: "issued",
    })
    .eq("id", invoiceId);

  if (error) {
    throw new Error(`Failed to update invoice: ${error.message}`);
  }
}

/**
 * Process a single invoice: generate PDF, send email, update DB.
 */
async function processSingleInvoice(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string,
  skipAutoCheck = false
): Promise<SendResult> {
  try {
    const { invoice, items, settings } = await loadInvoiceData(supabase, invoiceId);

    // Check auto-email setting unless explicitly skipped (manual resend)
    if (!skipAutoCheck) {
      const autoEnabled = await isAutoEmailEnabled(supabase, invoice.user_id);
      if (!autoEnabled) {
        return {
          invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
          success: false,
          error: "Auto-email disabled for this user",
        };
      }
    }

    // Validate recipient email
    if (!invoice.recipient_email) {
      return {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        success: false,
        error: "No recipient email address on invoice",
      };
    }

    // Generate PDF
    const pdfBytes = await generateInvoicePdf(invoice, items, settings);

    // Build email
    const subject = `Ihre Rechnung ${invoice.invoice_number} \u2014 Call Lana`;
    const htmlBody = invoiceEmailHtml(invoice, items);
    const fileName =
      `Rechnung_${(invoice.invoice_number || "Entwurf").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    // Send email
    await sendViaResend(
      invoice.recipient_email,
      subject,
      htmlBody,
      pdfBytes,
      fileName
    );

    // Update invoice record
    await markInvoiceSent(supabase, invoiceId);

    return {
      invoice_id: invoiceId,
      invoice_number: invoice.invoice_number,
      success: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error processing invoice ${invoiceId}:`, message);
    return {
      invoice_id: invoiceId,
      invoice_number: "",
      success: false,
      error: message,
    };
  }
}

// ==========================================
// MAIN HANDLER
// ==========================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: InvoiceRequest = await req.json();
    const supabase = createServiceClient();

    // --- Batch mode: process all unsent draft invoices ---
    if (body.batch === true) {
      const { data: unsent, error } = await supabase
        .from("invoices")
        .select("id")
        .eq("status", "draft")
        .eq("email_sent", false);

      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to query invoices: ${error.message}` }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      if (!unsent || unsent.length === 0) {
        return new Response(
          JSON.stringify({ message: "No unsent invoices found", results: [] }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Process sequentially to avoid rate limits
      const results: SendResult[] = [];
      for (const inv of unsent) {
        const result = await processSingleInvoice(supabase, inv.id);
        results.push(result);
      }

      const sent = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return new Response(
        JSON.stringify({ message: `Batch complete: ${sent} sent, ${failed} skipped/failed`, results }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // --- Multi-invoice mode: send multiple invoices in ONE email ---
    if (Array.isArray(body.invoice_ids) && body.invoice_ids.length > 0) {
      const invoiceIds: string[] = body.invoice_ids;
      const attachments: EmailAttachment[] = [];
      const invoiceSummaries: Array<{
        invoice_number: string;
        invoice_date: string;
        gross_amount_cents: number;
        recipient_name: string;
      }> = [];
      let recipientEmail = "";
      let recipientName = "";

      // Load all invoices, generate PDFs, collect data
      for (const invId of invoiceIds) {
        const { invoice, items, settings } = await loadInvoiceData(supabase, invId);

        if (!recipientEmail && invoice.recipient_email) {
          recipientEmail = invoice.recipient_email;
          recipientName = invoice.recipient_name || "";
        }

        const pdfBytes = await generateInvoicePdf(invoice, items, settings);
        const safeNumber = (invoice.invoice_number || "Entwurf").replace(/[^a-zA-Z0-9_-]/g, "_");
        attachments.push(pdfToAttachment(pdfBytes, `${safeNumber}.pdf`));

        invoiceSummaries.push({
          invoice_number: invoice.invoice_number || "\u2013",
          invoice_date: invoice.invoice_date,
          gross_amount_cents: invoice.gross_amount_cents ?? invoice.total_gross_cents ?? 0,
          recipient_name: invoice.recipient_name || "",
        });
      }

      if (!recipientEmail) {
        return new Response(
          JSON.stringify({ error: "No recipient email found on any of the selected invoices" }),
          { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Build multi-invoice email
      const subject = "Ihre Rechnungen \u2014 Call Lana";
      const htmlBody = multiInvoiceEmailHtml(recipientName, invoiceSummaries);

      await sendViaResendMulti(recipientEmail, subject, htmlBody, attachments);

      // Mark all invoices as sent
      const results: SendResult[] = [];
      for (const invId of invoiceIds) {
        try {
          await markInvoiceSent(supabase, invId);
          results.push({ invoice_id: invId, invoice_number: "", success: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          results.push({ invoice_id: invId, invoice_number: "", success: false, error: msg });
        }
      }

      const sent = results.filter((r) => r.success).length;
      return new Response(
        JSON.stringify({
          message: `${sent} Rechnungen in einer E-Mail gesendet`,
          results,
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // --- Single invoice mode ---
    if (!body.invoice_id) {
      return new Response(
        JSON.stringify({ error: "Missing invoice_id or batch flag" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // When called with a specific invoice_id, skip auto-check (manual trigger)
    const result = await processSingleInvoice(supabase, body.invoice_id, true);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error, invoice_id: result.invoice_id }),
        { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: `Invoice ${result.invoice_number} sent successfully`,
        invoice_id: result.invoice_id,
        invoice_number: result.invoice_number,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unhandled error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
