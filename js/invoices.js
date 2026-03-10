// ==========================================
// INVOICE MANAGEMENT FOR DASHBOARD
// ==========================================

/**
 * Load invoices from Supabase and render them into the dashboard table.
 */
async function loadInvoices() {
  const tableBody = document.getElementById('invoiceTableBody');
  if (!tableBody) return;

  try {
    const { data, error } = await supabaseClient
      .from('invoices')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (error) throw error;

    renderInvoiceTable(data || []);
  } catch (err) {
    Logger.error('loadInvoices', err);
    renderInvoiceTable([]);
  }
}

/**
 * Render invoice rows into #invoiceTableBody.
 * Columns: Rechnungsnr, Datum, Zeitraum, Betrag (brutto), Status, Aktionen
 */
function renderInvoiceTable(invoices) {
  const tableBody = document.getElementById('invoiceTableBody');
  if (!tableBody) return;

  if (!invoices || invoices.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--tx3);padding:30px;">Keine Rechnungen vorhanden</td></tr>';
    return;
  }

  tableBody.innerHTML = invoices.map(inv => {
    const invoiceDate = formatDateDE(inv.invoice_date);
    const periodStart = formatDateDE(inv.period_start);
    const periodEnd = formatDateDE(inv.period_end);
    const period = periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : '–';

    return `<tr>
      <td style="font-weight:600;">${escapeHtml(inv.invoice_number || '–')}</td>
      <td>${invoiceDate || '–'}</td>
      <td>${period}</td>
      <td style="font-weight:600;">${formatCents(inv.total_gross_cents || 0)}</td>
      <td>${getStatusBadge(inv.status)}</td>
      <td>
        <button class="btn-icon" onclick="downloadInvoicePdf('${inv.id}')" title="PDF herunterladen"
          style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.25);border-radius:8px;padding:6px 12px;cursor:pointer;color:var(--pu3);font-size:12px;font-weight:600;transition:all .2s;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>PDF
        </button>
      </td>
    </tr>`;
  }).join('');
}

/**
 * Format cents (integer) to German EUR currency string.
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted currency string, e.g. "1.234,56 EUR"
 */
function formatCents(cents) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

/**
 * Format an ISO date string to German DD.MM.YYYY format.
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date or empty string
 */
function formatDateDE(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Return HTML for a colored status badge based on invoice status.
 * @param {string} status - Invoice status key
 * @returns {string} HTML badge markup
 */
function getStatusBadge(status) {
  const statusMap = {
    draft:     { label: 'Entwurf',      bg: 'rgba(107,95,138,.15)',  color: 'var(--tx3)'   },
    issued:    { label: 'Ausgestellt',   bg: 'rgba(96,165,250,.15)',  color: '#60a5fa'      },
    paid:      { label: 'Bezahlt',       bg: 'rgba(74,222,128,.15)',  color: 'var(--green)' },
    cancelled: { label: 'Storniert',     bg: 'rgba(248,113,113,.15)', color: 'var(--red)'   },
    credited:  { label: 'Gutschrift',    bg: 'rgba(251,146,60,.15)',  color: 'var(--orange)' }
  };

  const s = statusMap[status] || statusMap.draft;
  return `<span class="status-badge" style="background:${s.bg};color:${s.color};">${s.label}</span>`;
}

/**
 * Escape HTML special characters for safe rendering.
 * @param {string} str - Raw string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Download a PDF for a given invoice.
 * Loads invoice, items, and settings from Supabase, then generates the PDF.
 * @param {string} invoiceId - UUID of the invoice
 */
async function downloadInvoicePdf(invoiceId) {
  try {
    // Load invoice
    const { data: invoice, error: invErr } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invErr) throw invErr;

    // Load invoice items
    const { data: items, error: itemsErr } = await supabaseClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('position', { ascending: true });

    if (itemsErr) throw itemsErr;

    // Load invoice settings
    const { data: settingsArr, error: setErr } = await supabaseClient
      .from('invoice_settings')
      .select('*')
      .limit(1);

    if (setErr) throw setErr;

    const settings = settingsArr && settingsArr.length > 0 ? settingsArr[0] : {};

    // Generate PDF
    await generateInvoicePdf(invoice, items || [], settings);
  } catch (err) {
    Logger.error('downloadInvoicePdf', err);
    if (typeof showToast === 'function') {
      showToast('PDF konnte nicht erstellt werden: ' + (err.message || err), true);
    }
  }
}
