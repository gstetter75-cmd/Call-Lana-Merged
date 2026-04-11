// Extracted from dashboard.js — Calls list, filters, detail view, CSV export
// Depends on: dashboard.js (globals: window.allCalls, escHtml, showToast, clanaDB, clanaUtils)
// ==========================================

// Window exports for cross-file access
window.loadAllCalls = loadAllCalls;
window.renderFilteredCalls = renderFilteredCalls;
window.initCallFilters = initCallFilters;
window.buildCallTable = buildCallTable;
window.showCallDetail = showCallDetail;
window.showTranscript = showTranscript;

// ==========================================
// LOAD ALL CALLS
// ==========================================
async function loadAllCalls() {
  const result = await clanaDB.getCalls(200);
  if (result.success && result.data.length > 0) {
    window.allCalls = result.data;
    renderFilteredCalls();
    initCallFilters();
  } else {
    window.allCalls = [];
    document.getElementById('allCallsBody').innerHTML = emptyCallsHTML();
  }
}

function renderFilteredCalls() {
  const search = (document.getElementById('callSearchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('callStatusFilter')?.value || '';
  const outcomeFilter = document.getElementById('callOutcomeFilter')?.value || '';
  const dateFrom = document.getElementById('callDateFrom')?.value || '';
  const dateTo = document.getElementById('callDateTo')?.value || '';

  const filtered = window.allCalls.filter(c => {
    if (search && !(c.phone_number || '').toLowerCase().includes(search) && !(c.caller_name || '').toLowerCase().includes(search)) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (outcomeFilter && c.outcome !== outcomeFilter) return false;
    if (dateFrom && c.created_at < dateFrom) return false;
    if (dateTo && c.created_at > dateTo + 'T23:59:59') return false;
    return true;
  });

  document.getElementById('allCallsCount').textContent = filtered.length + ' Anrufe';
  if (filtered.length > 0) {
    document.getElementById('allCallsBody').innerHTML = buildCallTable(filtered);
  } else {
    document.getElementById('allCallsBody').innerHTML = '<div class="empty-state"><h3>Keine Ergebnisse</h3><p>Versuche andere Filterkriterien.</p></div>';
  }
}

let _callFiltersInitialized = false;
function initCallFilters() {
  if (_callFiltersInitialized) return;
  _callFiltersInitialized = true;
  document.getElementById('callSearchInput')?.addEventListener('input', renderFilteredCalls);
  document.getElementById('callStatusFilter')?.addEventListener('change', renderFilteredCalls);
  document.getElementById('callOutcomeFilter')?.addEventListener('change', renderFilteredCalls);
  document.getElementById('callDateFrom')?.addEventListener('change', renderFilteredCalls);
  document.getElementById('callDateTo')?.addEventListener('change', renderFilteredCalls);
}

// ==========================================
// CALL TABLE
// ==========================================
function buildCallTable(calls) {
  let html = '<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Anrufer</th><th>Dauer</th><th>Status</th><th>Ergebnis</th><th>Sentiment</th><th>Details</th></tr></thead><tbody>';
  calls.forEach((c, i) => {
    const date = clanaUtils.formatDate(c.created_at);
    const phone = c.phone_number || '–';
    const callerName = c.caller_name ? window.escHtml(c.caller_name) : '';
    const dur = c.duration ? clanaUtils.formatDuration(c.duration) : '–';
    const statusMap = {
      completed: { label: 'Abgeschlossen', cls: 'completed' },
      missed: { label: 'Verpasst', cls: 'missed' },
      voicemail: { label: 'Mailbox', cls: 'voicemail' },
      active: { label: 'Aktiv', cls: 'active' }
    };
    const st = statusMap[c.status] || { label: c.status || '–', cls: 'completed' };

    // Outcome badge
    const outcomeMap = {
      termin: { label: 'Termin', cls: 'termin' },
      notfall: { label: 'Notfall', cls: 'notfall' },
      frage: { label: 'Frage', cls: 'frage' },
      abbruch: { label: 'Abbruch', cls: 'abbruch' }
    };
    const oc = outcomeMap[c.outcome] || null;
    const outcomeHtml = oc ? '<span class="outcome-badge ' + oc.cls + '">' + oc.label + '</span>' : '<span style="color:var(--tx3);font-size:11px;">–</span>';

    // Sentiment
    let sentimentHtml = '<span style="color:var(--tx3);font-size:11px;">–</span>';
    if (c.sentiment_score != null) {
      const score = parseFloat(c.sentiment_score);
      const color = score >= 7 ? 'var(--green)' : score >= 4 ? 'var(--orange)' : 'var(--red)';
      sentimentHtml = '<span class="sentiment-dot" style="background:' + color + ';"></span><span style="font-size:12px;font-weight:600;">' + score.toFixed(1) + '</span>';
    }

    const hasTranscript = c.transcript && c.transcript.trim().length > 0;
    const callerDisplay = callerName ? callerName + '<br><span style="font-size:11px;color:var(--tx3);">' + window.escHtml(phone) + '</span>' : window.escHtml(phone);

    html += '<tr style="cursor:pointer;" data-action="show-call" data-index="' + i + '">' +
      '<td>' + date + '</td>' +
      '<td>' + callerDisplay + '</td>' +
      '<td>' + dur + '</td>' +
      '<td><span class="status-badge ' + st.cls + '">' + st.label + '</span></td>' +
      '<td>' + outcomeHtml + '</td>' +
      '<td>' + sentimentHtml + '</td>' +
      '<td>' + (hasTranscript ? '<button data-action="show-call" data-index="' + i + '" style="background:none;border:1px solid var(--border2);border-radius:6px;padding:4px 10px;color:var(--pu3);font-size:11px;cursor:pointer;font-family:inherit;">Ansehen</button>' : '<span style="color:var(--tx3);font-size:11px;">—</span>') + '</td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

// ==========================================
// CALL DETAIL OVERLAY
// ==========================================
function showCallDetail(callIndex) {
  const call = window.allCalls[callIndex];
  if (!call) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  const phone = window.escHtml(call.phone_number || 'Unbekannt');
  const callerName = call.caller_name ? window.escHtml(call.caller_name) : '';
  const date = clanaUtils.formatDate(call.created_at);
  const dur = call.duration ? clanaUtils.formatDuration(call.duration) : '–';

  // Outcome
  const outcomeMap = { termin: 'Termin', notfall: 'Notfall', frage: 'Frage', abbruch: 'Abbruch' };
  const outcomeLabel = outcomeMap[call.outcome] || '–';

  // Sentiment
  let sentimentDisplay = '–';
  if (call.sentiment_score != null) {
    const score = parseFloat(call.sentiment_score);
    const color = score >= 7 ? 'var(--green)' : score >= 4 ? 'var(--orange)' : 'var(--red)';
    sentimentDisplay = '<span style="color:' + color + ';font-weight:700;">' + score.toFixed(1) + '/10</span>';
  }

  // Parse transcript into lines
  let transcriptHtml = '';
  if (call.transcript && call.transcript.trim()) {
    const lines = call.transcript.trim().split('\n').filter(l => l.trim());
    transcriptHtml = '<div style="margin-top:20px;">' +
      '<h4 style="font-size:13px;font-weight:700;margin-bottom:12px;">Transkript</h4>' +
      '<div style="background:var(--bg2);border-radius:12px;padding:16px;">';

    lines.forEach(line => {
      const trimmed = line.trim();
      const tsMatch = trimmed.match(/^\[?([\d:]+)\]?\s*(.+)/);
      let timestamp = '';
      let rest = trimmed;
      if (tsMatch && tsMatch[1].includes(':') && tsMatch[1].length <= 8) {
        timestamp = tsMatch[1];
        rest = tsMatch[2];
      }

      const speakerMatch = rest.match(/^(Lana|Anrufer|Caller|Agent|Kunde|Customer)\s*:\s*(.*)/i);
      if (speakerMatch) {
        const speaker = speakerMatch[1];
        const text = window.escHtml(speakerMatch[2]);
        const isLana = /lana|agent/i.test(speaker);
        const speakerCls = isLana ? 'lana' : 'caller';
        const speakerLabel = isLana ? 'Lana' : 'Anrufer';
        transcriptHtml += '<div class="transcript-line">' +
          '<span class="transcript-speaker ' + speakerCls + '">' + speakerLabel + '</span>' +
          '<span class="transcript-text">' + text + '</span>' +
          (timestamp ? '<span class="transcript-timestamp">' + timestamp + '</span>' : '') +
        '</div>';
      } else {
        transcriptHtml += '<div class="transcript-line">' +
          '<span class="transcript-speaker" style="color:var(--tx3);">…</span>' +
          '<span class="transcript-text">' + window.escHtml(trimmed) + '</span>' +
        '</div>';
      }
    });

    transcriptHtml += '</div></div>';
  }

  overlay.innerHTML = '<div class="transcript-modal">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
      '<div><h3 style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:700;">Anruf-Details</h3>' +
      '<div style="font-size:12px;color:var(--tx3);margin-top:4px;">' + (callerName ? callerName + ' · ' : '') + phone + '</div></div>' +
      '<button data-action="close-overlay" style="background:none;border:none;color:var(--tx3);font-size:1.4rem;cursor:pointer;">✕</button>' +
    '</div>' +
    '<div class="transcript-meta">' +
      '<div class="transcript-meta-item"><div class="transcript-meta-label">Datum</div><div class="transcript-meta-value">' + date + '</div></div>' +
      '<div class="transcript-meta-item"><div class="transcript-meta-label">Dauer</div><div class="transcript-meta-value">' + dur + '</div></div>' +
      '<div class="transcript-meta-item"><div class="transcript-meta-label">Ergebnis</div><div class="transcript-meta-value">' + outcomeLabel + '</div></div>' +
      '<div class="transcript-meta-item"><div class="transcript-meta-label">Sentiment</div><div class="transcript-meta-value">' + sentimentDisplay + '</div></div>' +
    '</div>' +
    transcriptHtml +
  '</div>';

  document.body.appendChild(overlay);
}

// Legacy alias
function showTranscript(callIndex) { showCallDetail(callIndex); }

// ==========================================
// CSV EXPORT
// ==========================================
const CallsPage = {
  exportCSV() {
    if (!window.allCalls.length) {
      window.showToast('Keine Anrufe zum Exportieren.', true);
      return;
    }

    const headers = ['Datum', 'Telefonnummer', 'Anrufer', 'Dauer (Sek)', 'Status', 'Ergebnis', 'Sentiment'];
    const rows = window.allCalls.map(c => [
      c.created_at ? new Date(c.created_at).toLocaleString('de-DE') : '',
      c.phone_number || '',
      c.caller_name || '',
      c.duration || 0,
      c.status || '',
      c.outcome || '',
      c.sentiment_score != null ? c.sentiment_score : ''
    ]);

    let csv = '\uFEFF'; // BOM for Excel UTF-8
    csv += headers.join(';') + '\n';
    rows.forEach(row => {
      csv += row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anrufe_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    window.showToast('CSV exportiert.');
  }
};
window.CallsPage = CallsPage;

function emptyCallsHTML() {
  return '<div class="empty-state"><div class="icon">📞</div><h3>Noch keine Anrufe</h3><p>Sobald Lana Anrufe entgegennimmt, erscheinen sie hier.</p></div>';
}
