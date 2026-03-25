// ==========================================
// GLOBALS
// ==========================================
let currentUser = null;
let currentProfile = null;
let allCalls = [];
let assistantsList = [];
let editingAssistantId = null;
let currentConversationId = null;

// ==========================================
// AUTH CHECK (role-based)
// ==========================================
(async () => {
  currentProfile = await AuthGuard.requireCustomer();
  if (!currentProfile) return;

  currentUser = await clanaAuth.getUser();
  const name = AuthGuard.getDisplayName(currentProfile);

  document.getElementById('userName').textContent = name;
  document.getElementById('userEmail').textContent = currentProfile.email || currentUser?.email || '';
  document.getElementById('userAvatar').textContent = AuthGuard.getInitials(currentProfile);

  initMonthSelect();

  await Promise.all([
    loadHomeData(),
    loadAllCalls(),
    loadBilling(),
    loadPlan(),
    loadAssistants(),
    loadTeam(),
    loadConversations(),
    loadInvoices()
  ]);

  // Team management
  document.getElementById('btnInviteMember')?.addEventListener('click', inviteTeamMember);
  document.getElementById('btnNewConversation')?.addEventListener('click', startNewConversation);
  document.getElementById('btnSendMessage')?.addEventListener('click', sendMessage);
  document.getElementById('messageInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
})();

// ==========================================
// MONTH SELECT
// ==========================================
function initMonthSelect() {
  const sel = document.getElementById('monthSelect');
  const now = new Date();
  const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = months[d.getMonth()] + ' ' + d.getFullYear();
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => loadHomeData());
}

// ==========================================
// HOME DATA
// ==========================================
async function loadHomeData() {
  const monthOffset = parseInt(document.getElementById('monthSelect').value) || 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0, 23, 59, 59);

  const result = await clanaDB.getStats(start.toISOString(), end.toISOString());
  if (result.success) {
    const s = result.stats;
    document.getElementById('csAnrufe').textContent = s.totalCalls.toLocaleString('de-DE');
    document.getElementById('csSms').textContent = formatMinutes(s.avgDuration);
    const completedCalls = s.statuses?.completed || 0;
    const successRate = s.totalCalls > 0 ? Math.round((completedCalls / s.totalCalls) * 100) : 0;
    document.getElementById('csKosten').textContent = successRate + '%';
  } else {
    document.getElementById('csAnrufe').textContent = '0';
    document.getElementById('csSms').textContent = '0 min';
    document.getElementById('csKosten').textContent = '0%';
  }

  // Balance donut
  const settingsResult = await clanaDB.getSettings();
  const settings = settingsResult.success ? settingsResult.data : {};
  const balance = settings.balance || 0;
  const maxBalance = Math.max(balance * 1.5, 100);
  const pct = Math.min(balance / maxBalance, 1);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct * circumference);
  document.getElementById('donutArc').setAttribute('stroke-dashoffset', offset);
  document.getElementById('donutCenter').textContent = formatCurrency(balance);

  // Call chart
  drawCallChart(start, end);
}

// ==========================================
// SVG LINE CHART
// ==========================================
async function drawCallChart(start, end) {
  const svg = document.getElementById('callChart');
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const callsResult = await clanaDB.getCalls(1000);
  const calls = callsResult.success ? callsResult.data : [];

  // Previous month range
  const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59);
  const prevDays = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0).getDate();

  // Count calls per day (current + previous month)
  const dayCounts = new Array(daysInMonth).fill(0);
  const prevCounts = new Array(prevDays).fill(0);
  calls.forEach(c => {
    const d = new Date(c.created_at);
    if (d >= start && d <= end) {
      dayCounts[d.getDate() - 1]++;
    } else if (d >= prevStart && d <= prevEnd) {
      prevCounts[d.getDate() - 1]++;
    }
  });

  const maxVal = Math.max(...dayCounts, ...prevCounts, 1);
  const w = 600;
  const h = 140;
  const padT = 10, padB = 25, padL = 5, padR = 5;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  function buildPath(counts, numDays) {
    return counts.slice(0, numDays).map((v, i) => {
      const x = padL + (i / (numDays - 1)) * chartW;
      const y = padT + chartH - (v / maxVal) * chartH;
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }

  const pathD = buildPath(dayCounts, daysInMonth);
  const prevPathD = buildPath(prevCounts, Math.min(prevDays, daysInMonth));

  // Area fill for current month
  const points = dayCounts.map((v, i) => ({
    x: padL + (i / (daysInMonth - 1)) * chartW,
    y: padT + chartH - (v / maxVal) * chartH
  }));
  const areaD = pathD + ' L' + points[points.length - 1].x.toFixed(1) + ',' + (padT + chartH) + ' L' + points[0].x.toFixed(1) + ',' + (padT + chartH) + ' Z';

  // X-axis labels
  let labels = '';
  for (let i = 0; i < daysInMonth; i += 5) {
    const x = padL + (i / (daysInMonth - 1)) * chartW;
    labels += '<text x="' + x.toFixed(1) + '" y="' + (h - 4) + '" fill="var(--tx3)" font-size="9" text-anchor="middle" font-family="Manrope">' + (i + 1) + '</text>';
  }

  svg.innerHTML =
    '<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--pu)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--pu)" stop-opacity="0.02"/></linearGradient></defs>' +
    '<path d="' + areaD + '" fill="url(#chartGrad)"/>' +
    '<path d="' + prevPathD + '" fill="none" stroke="var(--tx3)" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round" opacity="0.4"/>' +
    '<path d="' + pathD + '" fill="none" stroke="var(--pu3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text x="' + (w - padR) + '" y="' + (padT + 10) + '" fill="var(--pu3)" font-size="8" text-anchor="end" font-family="Manrope">● Aktuell</text>' +
    '<text x="' + (w - padR) + '" y="' + (padT + 22) + '" fill="var(--tx3)" font-size="8" text-anchor="end" font-family="Manrope" opacity="0.5">┄ Vormonat</text>' +
    labels;
}

// ==========================================
// ASSISTANTS
// ==========================================
async function loadAssistants() {
  const result = await clanaDB.getAssistants();
  if (result.success) {
    assistantsList = result.data;
  } else {
    assistantsList = [];
  }
  renderAssistantsList();
  renderHomeAssistants();
  renderPhonesFromAssistants();
}

function renderHomeAssistants() {
  const container = document.getElementById('homeAssistants');
  if (assistantsList.length === 0) {
    container.innerHTML = '<div class="assistant-card" onclick="createNewAssistant()" style="display:flex;align-items:center;justify-content:center;min-height:80px;border-style:dashed;"><span style="color:var(--tx3);font-size:13px;">+ Neuen Assistenten erstellen</span></div>';
    return;
  }
  container.innerHTML = assistantsList.map(a =>
    '<div class="assistant-card" onclick="editAssistant(\'' + a.id + '\')">' +
      '<div class="ac-top">' +
        '<div class="ac-name">' + escHtml(a.name) + '</div>' +
        '<span class="live-badge ' + (a.status === 'live' ? 'live' : 'offline') + '">' + (a.status === 'live' ? 'LIVE' : 'Offline') + '</span>' +
      '</div>' +
      '<div class="ac-phone">' + (a.phone_number || 'Keine Nummer') + '</div>' +
    '</div>'
  ).join('');
}

function renderAssistantsList() {
  const container = document.getElementById('assistantsListBody');
  if (assistantsList.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🤖</div><h3>Keine Assistenten</h3><p>Erstelle deinen ersten KI-Assistenten.</p></div>';
    return;
  }
  let html = '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Status</th><th>Telefonnummer</th><th>Stimme</th><th>Erstellt</th><th>Aktionen</th></tr></thead><tbody>';
  assistantsList.forEach(a => {
    const statusCls = a.status === 'live' ? 'completed' : 'voicemail';
    const statusLabel = a.status === 'live' ? 'LIVE' : 'Offline';
    html += '<tr>' +
      '<td style="font-weight:600;color:var(--tx);cursor:pointer;" onclick="editAssistant(\'' + a.id + '\')">' + escHtml(a.name) + '</td>' +
      '<td><span class="status-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
      '<td>' + (a.phone_number || '–') + '</td>' +
      '<td>' + escHtml(a.voice || 'Marie') + '</td>' +
      '<td>' + clanaUtils.formatDate(a.created_at) + '</td>' +
      '<td><button onclick="event.stopPropagation();deleteAssistant(\'' + a.id + '\',\'' + escHtml(a.name) + '\')" style="background:none;border:1px solid rgba(248,113,113,.3);border-radius:6px;padding:4px 10px;color:var(--red);font-size:11px;cursor:pointer;font-family:inherit;">Löschen</button></td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function renderPhonesFromAssistants() {
  const container = document.getElementById('phonesListBody');
  const withPhone = assistantsList.filter(a => a.phone_number);
  document.getElementById('phonesCount').textContent = withPhone.length + ' Nummern';

  if (withPhone.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📱</div><h3>Keine Nummern</h3><p>Füge eine Telefonnummer hinzu, um Anrufe entgegenzunehmen.</p></div>';
    return;
  }

  container.innerHTML = withPhone.map(a =>
    '<div class="phone-item">' +
      '<div class="phone-number-text">' + escHtml(a.phone_number) + '</div>' +
      '<span class="status-badge ' + (a.status === 'live' ? 'completed' : 'voicemail') + '">' + (a.status === 'live' ? 'Aktiv' : 'Inaktiv') + '</span>' +
      '<div class="phone-assistant">' + escHtml(a.name) + '</div>' +
    '</div>'
  ).join('');
}

// NEW ASSISTANT
document.getElementById('btnNewAssistant').addEventListener('click', createNewAssistant);

function createNewAssistant() {
  editingAssistantId = null;
  document.getElementById('editTitle').textContent = 'Neuer Assistent';
  document.getElementById('editDesc').textContent = 'Erstelle einen neuen KI-Assistenten.';
  clearEditorForm();
  navigateToPage('assistant-edit');
}

// EDIT ASSISTANT
function editAssistant(id) {
  const a = assistantsList.find(x => x.id === id);
  if (!a) return;
  editingAssistantId = id;
  document.getElementById('editTitle').textContent = a.name;
  document.getElementById('editDesc').textContent = 'Konfiguriere deinen Assistenten.';

  document.getElementById('edName').value = a.name || '';
  document.getElementById('edVoice').value = a.voice || 'Marie';
  document.getElementById('edLang').value = a.language || 'de';
  document.getElementById('edGreeting').value = a.greeting || '';
  document.getElementById('edModel').value = a.model || 'gpt-4';
  document.getElementById('edTemp').value = a.temperature ?? 0.7;
  document.getElementById('edMaxDuration').value = a.max_duration || 300;

  const tools = a.tools || {};
  document.getElementById('edToolCalendar').checked = !!tools.calendar;
  document.getElementById('edToolCRM').checked = !!tools.crm;
  document.getElementById('edToolEmail').checked = !!tools.email;
  document.getElementById('edToolKB').checked = !!tools.knowledge_base;

  const pp = a.post_processing || {};
  document.getElementById('edPostSummary').checked = !!pp.summary;
  document.getElementById('edPostTranscript').checked = !!pp.transcript_email;
  document.getElementById('edPostSentiment').checked = !!pp.sentiment;

  const ob = a.outbound || {};
  document.getElementById('edOutboundEnabled').checked = !!ob.enabled;
  document.getElementById('edOutboundMax').value = ob.max_concurrent || 1;
  document.getElementById('edOutboundFrom').value = ob.time_from || '09:00';
  document.getElementById('edOutboundTo').value = ob.time_to || '18:00';

  navigateToPage('assistant-edit');
}

function clearEditorForm() {
  document.getElementById('edName').value = '';
  document.getElementById('edVoice').value = 'Marie';
  document.getElementById('edLang').value = 'de';
  document.getElementById('edGreeting').value = '';
  document.getElementById('edModel').value = 'gpt-4';
  document.getElementById('edTemp').value = '0.7';
  document.getElementById('edMaxDuration').value = '300';
  document.getElementById('edToolCalendar').checked = false;
  document.getElementById('edToolCRM').checked = false;
  document.getElementById('edToolEmail').checked = false;
  document.getElementById('edToolKB').checked = false;
  document.getElementById('edPostSummary').checked = false;
  document.getElementById('edPostTranscript').checked = false;
  document.getElementById('edPostSentiment').checked = false;
  document.getElementById('edOutboundEnabled').checked = false;
  document.getElementById('edOutboundMax').value = '1';
  document.getElementById('edOutboundFrom').value = '09:00';
  document.getElementById('edOutboundTo').value = '18:00';
}

// SAVE ASSISTANT
document.getElementById('btnSaveAssistant').addEventListener('click', async () => {
  const name = document.getElementById('edName').value.trim();
  if (!name) { showToast('Bitte einen Namen eingeben.', true); return; }

  const saveBtn = document.getElementById('btnSaveAssistant');
  const origText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Speichern…';

  const payload = {
    name,
    voice: document.getElementById('edVoice').value,
    language: document.getElementById('edLang').value,
    greeting: document.getElementById('edGreeting').value,
    model: document.getElementById('edModel').value,
    temperature: parseFloat(document.getElementById('edTemp').value),
    max_duration: parseInt(document.getElementById('edMaxDuration').value),
    tools: {
      calendar: document.getElementById('edToolCalendar').checked,
      crm: document.getElementById('edToolCRM').checked,
      email: document.getElementById('edToolEmail').checked,
      knowledge_base: document.getElementById('edToolKB').checked
    },
    post_processing: {
      summary: document.getElementById('edPostSummary').checked,
      transcript_email: document.getElementById('edPostTranscript').checked,
      sentiment: document.getElementById('edPostSentiment').checked
    },
    outbound: {
      enabled: document.getElementById('edOutboundEnabled').checked,
      max_concurrent: parseInt(document.getElementById('edOutboundMax').value),
      time_from: document.getElementById('edOutboundFrom').value,
      time_to: document.getElementById('edOutboundTo').value
    }
  };

  let result;
  if (editingAssistantId) {
    result = await clanaDB.updateAssistant(editingAssistantId, payload);
  } else {
    result = await clanaDB.createAssistant(payload);
  }

  if (result.success) {
    showToast(editingAssistantId ? 'Assistent aktualisiert!' : 'Assistent erstellt!');
    await loadAssistants();
    navigateToPage('assistants');
  } else {
    showToast('Fehler: ' + result.error, true);
  }
  saveBtn.disabled = false;
  saveBtn.textContent = origText;
});

// EDITOR TABS
document.querySelectorAll('.editor-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.editor-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ==========================================
// ALL CALLS (TRANSACTIONS)
// ==========================================
async function loadAllCalls() {
  const result = await clanaDB.getCalls(50);
  if (result.success && result.data.length > 0) {
    allCalls = result.data;
    document.getElementById('allCallsCount').textContent = result.data.length + ' Anrufe';
    document.getElementById('allCallsBody').innerHTML = buildCallTable(result.data);
  } else {
    allCalls = [];
    document.getElementById('allCallsBody').innerHTML = emptyCallsHTML();
  }
}

// ==========================================
// BILLING
// ==========================================
async function loadBilling() {
  const settingsResult = await clanaDB.getSettings();
  const settings = settingsResult.success ? settingsResult.data : {};
  const balance = settings.balance || 0;

  document.getElementById('balanceValue').textContent = formatCurrency(balance);
  document.getElementById('balanceSub').textContent = balance > 0 ? 'Verfügbar' : 'Kein Guthaben vorhanden';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = now.toISOString();
  const statsResult = await clanaDB.getStats(monthStart, monthEnd);

  if (statsResult.success) {
    const s = statsResult.stats;
    document.getElementById('usageCalls').textContent = s.totalCalls.toLocaleString('de-DE');
    document.getElementById('usageMinutes').textContent = Math.round(s.totalDuration / 60).toLocaleString('de-DE');
    const cost = (s.totalDuration / 60) * 0.15;
    document.getElementById('usageCost').textContent = formatCurrency(cost);
  } else {
    document.getElementById('usageCalls').textContent = '0';
    document.getElementById('usageMinutes').textContent = '0';
    document.getElementById('usageCost').textContent = '0,00 €';
  }
}

// ==========================================
// PLAN
// ==========================================
async function loadPlan() {
  const meta = currentUser?.user_metadata || {};
  const plan = meta.plan || 'free';
  const plans = {
    free: { name: 'Free-Plan', desc: 'Du nutzt den kostenlosen Plan.', features: ['100 Testminuten', '1 Benutzer', 'E-Mail-Support'] },
    solo: { name: 'Solo-Plan', desc: 'Ideal für Einzelunternehmer.', features: ['1.000 Minuten/Monat', '1 Benutzer', '1 KI-Stimme', 'Eigene Telefonnummer', 'Basis-Reporting'] },
    team: { name: 'Team-Plan', desc: 'Perfekt für wachsende Teams.', features: ['3.000 Minuten/Monat', 'Unbegrenzte Benutzer', '5 gleichzeitige Gespräche', 'Alle Stimmen', 'CRM-Integration'] },
    business: { name: 'Business-Plan', desc: 'Für große Unternehmen.', features: ['Unbegrenzte Minuten', 'Eigene KI-Stimme', 'SLA-Garantie 99,9%', 'API-Zugang', 'Dedizierter Account Manager'] }
  };

  const p = plans[plan] || plans.free;
  document.getElementById('planBadge').textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
  document.getElementById('planName').textContent = p.name;
  document.getElementById('planDesc').textContent = p.desc;
  document.getElementById('planFeatures').innerHTML = p.features.map(f => '<li>' + f + '</li>').join('');
}

// ==========================================
// KNOWLEDGE BASE (placeholder)
// ==========================================
document.getElementById('btnUploadDoc').addEventListener('click', () => {
  showToast('Dokument-Upload wird bald verfügbar sein.');
});

document.getElementById('kbSearch').addEventListener('input', (e) => {
  // Placeholder search - no documents yet
});

// ==========================================
// HELPERS
// ==========================================
function buildCallTable(calls) {
  let html = '<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Telefonnummer</th><th>Dauer</th><th>Status</th><th>Transkript</th></tr></thead><tbody>';
  calls.forEach((c, i) => {
    const date = clanaUtils.formatDate(c.created_at);
    const phone = c.phone_number || '–';
    const dur = c.duration ? clanaUtils.formatDuration(c.duration) : '–';
    const statusMap = {
      completed: { label: 'Abgeschlossen', cls: 'completed' },
      missed: { label: 'Verpasst', cls: 'missed' },
      voicemail: { label: 'Mailbox', cls: 'voicemail' },
      active: { label: 'Aktiv', cls: 'active' }
    };
    const st = statusMap[c.status] || { label: c.status || '–', cls: 'completed' };
    const hasTranscript = c.transcript && c.transcript.trim().length > 0;
    html += '<tr><td>' + date + '</td><td>' + escHtml(phone) + '</td><td>' + dur + '</td><td><span class="status-badge ' + st.cls + '">' + st.label + '</span></td>' +
      '<td>' + (hasTranscript ? '<button onclick="showTranscript(' + i + ')" style="background:none;border:1px solid var(--border2);border-radius:6px;padding:4px 10px;color:var(--pu3);font-size:11px;cursor:pointer;font-family:inherit;">Ansehen</button>' : '<span style="color:var(--tx3);font-size:11px;">—</span>') + '</td></tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function showTranscript(callIndex) {
  const call = allCalls[callIndex];
  if (!call || !call.transcript) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  const phone = call.phone_number || 'Unbekannt';
  const date = clanaUtils.formatDate(call.created_at);
  const dur = call.duration ? clanaUtils.formatDuration(call.duration) : '–';

  overlay.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:32px;width:100%;max-width:600px;max-height:80vh;overflow-y:auto;margin:16px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
      '<div><h3 style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:700;">Anruf-Transkript</h3>' +
      '<div style="font-size:12px;color:var(--tx3);margin-top:4px;">' + escHtml(phone) + ' · ' + date + ' · ' + dur + '</div></div>' +
      '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background:none;border:none;color:var(--tx3);font-size:1.4rem;cursor:pointer;">✕</button>' +
    '</div>' +
    '<div style="background:var(--bg2);border-radius:12px;padding:20px;font-size:13px;line-height:1.8;color:var(--tx2);white-space:pre-wrap;">' + escHtml(call.transcript) + '</div>' +
  '</div>';

  document.body.appendChild(overlay);
}

function emptyCallsHTML() {
  return '<div class="empty-state"><div class="icon">📞</div><h3>Noch keine Anrufe</h3><p>Sobald Lana Anrufe entgegennimmt, erscheinen sie hier.</p></div>';
}

function formatMinutes(seconds) {
  if (!seconds || seconds === 0) return '0 min';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return s + ' sek';
  return m + ':' + String(s).padStart(2, '0') + ' min';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

async function deleteAssistant(id, name) {
  if (!confirm('Assistent "' + name + '" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
  const result = await clanaDB.deleteAssistant(id);
  if (result.success) {
    showToast('Assistent gelöscht.');
    await loadAssistants();
  } else {
    showToast('Fehler: ' + result.error, true);
  }
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => t.className = 'toast', 3000);
}

// ==========================================
// NAVIGATION
// ==========================================
// ==========================================
// TEAM MANAGEMENT
// ==========================================
async function loadTeam() {
  if (!currentProfile?.organization_id) {
    document.getElementById('teamListBody').innerHTML =
      '<div class="empty-state"><h3>Keine Organisation</h3><p>Dein Account ist keiner Organisation zugeordnet.</p></div>';
    return;
  }
  const result = await clanaDB.getOrganization(currentProfile.organization_id);
  if (!result.success || !result.data?.organization_members) {
    document.getElementById('teamListBody').innerHTML =
      '<div class="empty-state"><h3>Keine Teammitglieder</h3><p>Lade Teammitglieder ein.</p></div>';
    return;
  }
  const members = result.data.organization_members;
  document.getElementById('teamCount').textContent = members.length + ' Mitglieder';

  if (members.length === 0) {
    document.getElementById('teamListBody').innerHTML =
      '<div class="empty-state"><h3>Keine Teammitglieder</h3><p>Lade Teammitglieder ein.</p></div>';
    return;
  }

  let html = '<div class="table-wrap"><table><thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Beigetreten</th></tr></thead><tbody>';
  members.forEach(m => {
    const p = m.profiles || {};
    html += '<tr>' +
      '<td style="font-weight:600;">' + escHtml((p.first_name || '') + ' ' + (p.last_name || '')) + '</td>' +
      '<td>' + escHtml(p.email || '') + '</td>' +
      '<td><span class="status-badge completed">' + (m.role_in_org || 'member') + '</span></td>' +
      '<td>' + clanaUtils.formatDate(m.created_at) + '</td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';
  document.getElementById('teamListBody').innerHTML = html;
}

function inviteTeamMember() {
  document.getElementById('inviteEmail').value = '';
  document.getElementById('inviteRole').value = 'member';
  document.getElementById('modal-invite-member').classList.add('active');
}

function closeInviteModal() {
  document.getElementById('modal-invite-member').classList.remove('active');
}

function sendInvite() {
  const email = document.getElementById('inviteEmail').value.trim();
  const role = document.getElementById('inviteRole').value;

  if (!email || !clanaUtils.validateEmail(email)) {
    showToast('Bitte eine gueltige E-Mail-Adresse eingeben.', true);
    return;
  }

  closeInviteModal();
  showToast('Einladung an ' + email + ' als ' + role + ' gesendet.');
}

// ==========================================
// MESSAGING
// ==========================================
async function loadConversations() {
  const result = await clanaDB.getConversations();
  if (!result.success || !result.data?.length) {
    document.getElementById('conversationsList').innerHTML =
      '<div class="empty-state" style="padding:24px;"><h3>Keine Nachrichten</h3><p>Starte eine Konversation.</p></div>';
    return;
  }

  document.getElementById('conversationsList').innerHTML = result.data.map(c => {
    const lastMsg = c.messages?.length ? c.messages[c.messages.length - 1] : null;
    const participants = (c.conversation_participants || []).map(p => {
      const profile = p.profiles;
      return profile ? (profile.first_name || '') + ' ' + (profile.last_name || '') : '';
    }).filter(Boolean).join(', ');

    return '<div class="phone-item" style="cursor:pointer;padding:12px;" onclick="openConversation(\'' + c.id + '\')">' +
      '<div style="font-weight:600;font-size:13px;margin-bottom:2px;">' + escHtml(c.subject || participants || 'Konversation') + '</div>' +
      (lastMsg ? '<div style="font-size:11px;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(lastMsg.content).substring(0, 60) + '</div>' : '') +
    '</div>';
  }).join('');
}

async function openConversation(convId) {
  currentConversationId = convId;
  document.getElementById('messageInputArea').style.display = 'block';

  const result = await clanaDB.getMessages(convId);
  if (!result.success) { showToast('Fehler beim Laden der Nachrichten', true); return; }

  const area = document.getElementById('messageArea');
  if (!result.data?.length) {
    area.innerHTML = '<div class="empty-state"><p>Noch keine Nachrichten in dieser Konversation.</p></div>';
    return;
  }

  area.innerHTML = result.data.map(m => {
    const isMe = m.sender_id === currentUser?.id;
    const sender = m.profiles ? (m.profiles.first_name || '') + ' ' + (m.profiles.last_name || '') : 'Unbekannt';
    const time = new Date(m.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    return '<div style="margin-bottom:12px;text-align:' + (isMe ? 'right' : 'left') + ';">' +
      '<div style="display:inline-block;max-width:70%;background:' + (isMe ? 'rgba(124,58,237,.15)' : 'var(--card)') + ';border:1px solid var(--border);border-radius:12px;padding:10px 14px;text-align:left;">' +
        '<div style="font-size:11px;color:var(--tx3);margin-bottom:4px;">' + escHtml(sender) + ' &middot; ' + time + '</div>' +
        '<div style="font-size:13px;">' + escHtml(m.content) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  area.scrollTop = area.scrollHeight;

  await clanaDB.markConversationRead(convId);
}

async function sendMessage() {
  if (!currentConversationId) return;
  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  if (!content) return;

  input.value = '';
  const result = await clanaDB.sendMessage(currentConversationId, content);
  if (result.success) {
    openConversation(currentConversationId);
    loadConversations();
  } else {
    showToast('Fehler beim Senden: ' + result.error, true);
  }
}

function startNewConversation() {
  document.getElementById('convSubject').value = '';
  document.getElementById('convMessage').value = '';
  document.getElementById('modal-new-conversation').classList.add('active');
}

function closeNewConvModal() {
  document.getElementById('modal-new-conversation').classList.remove('active');
}

async function createNewConversation() {
  const subject = document.getElementById('convSubject').value.trim();
  const message = document.getElementById('convMessage').value.trim();

  if (!message) {
    showToast('Bitte eine Nachricht eingeben.', true);
    return;
  }

  const convResult = await clanaDB.createConversation(subject || 'Neue Konversation', []);
  if (!convResult.success) {
    showToast('Fehler beim Erstellen: ' + convResult.error, true);
    return;
  }

  const msgResult = await clanaDB.sendMessage(convResult.data.id, message);
  if (!msgResult.success) {
    showToast('Konversation erstellt, aber Nachricht konnte nicht gesendet werden.', true);
  }

  closeNewConvModal();
  await loadConversations();
  openConversation(convResult.data.id);
}

const breadcrumbNames = {
  home: 'Home',
  assistants: 'Assistenten',
  'assistant-edit': 'Assistent bearbeiten',
  knowledge: 'Wissensdatenbank',
  phones: 'Telefonnummern',
  transactions: 'Anrufverlauf',
  billing: 'Guthaben',
  payment: 'Zahlungsmethoden',
  plans: 'Paket',
  team: 'Team',
  messages: 'Nachrichten',
  integrations: 'Integrationen'
};

function navigateToPage(page, updateHash = true) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');

  document.querySelectorAll('.sb-item').forEach(item => item.classList.remove('active'));
  document.querySelector('[data-page="' + page + '"]')?.classList.add('active');

  document.getElementById('breadcrumb').textContent = breadcrumbNames[page] || page;
  if (updateHash) window.location.hash = page;

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');

  // Reset editor tabs on enter
  if (page === 'assistant-edit') {
    document.querySelectorAll('.editor-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.editor-panel').forEach((p, i) => p.classList.toggle('active', i === 0));
  }
}

document.querySelectorAll('.sb-item[data-page]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToPage(item.dataset.page);
  });
});

window.addEventListener('hashchange', () => {
  const page = window.location.hash.slice(1) || 'home';
  navigateToPage(page, false);
});

const initialPage = window.location.hash.slice(1) || 'home';
if (initialPage !== 'home') navigateToPage(initialPage, false);

// ==========================================
// MOBILE SIDEBAR
// ==========================================
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
});
document.getElementById('sidebarClose').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
});
document.getElementById('sidebarOverlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
});

// ==========================================
// LOGOUT
// ==========================================
document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (!confirm('Möchtest du dich wirklich abmelden?')) return;
  const result = await clanaAuth.signOut();
  if (result.success) {
    window.location.href = 'login.html';
  } else {
    showToast('Logout fehlgeschlagen: ' + result.error, true);
  }
});

// ==========================================
// BILLING & BALANCE
// ==========================================
const OVERAGE_RATE_CENTS = 15; // 0,15€ per minute overage

let selectedTopupAmount = 5000; // default 50€

function openTopupModal() {
  document.getElementById('topupModal').style.display = 'flex';
  document.getElementById('customTopup').value = '';
  selectTopup(document.querySelector('.topup-btn.active'));
}

function closeTopupModal() {
  document.getElementById('topupModal').style.display = 'none';
}

function selectTopup(btn) {
  document.querySelectorAll('.topup-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedTopupAmount = parseInt(btn.dataset.amount);
  document.getElementById('customTopup').value = '';
  updateTopupButton();
}

document.getElementById('customTopup')?.addEventListener('input', function() {
  if (this.value) {
    document.querySelectorAll('.topup-btn').forEach(b => b.classList.remove('active'));
    selectedTopupAmount = Math.round(parseFloat(this.value) * 100);
  }
  updateTopupButton();
});

function updateTopupButton() {
  const custom = document.getElementById('customTopup').value;
  const amount = custom ? Math.round(parseFloat(custom) * 100) : selectedTopupAmount;
  document.getElementById('topupConfirmBtn').textContent = formatCents(amount) + ' aufladen';
}

function formatCents(cents) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

async function confirmTopup() {
  const custom = document.getElementById('customTopup').value;
  const amount = custom ? Math.round(parseFloat(custom) * 100) : selectedTopupAmount;

  if (amount < 500) { showToast('Mindestbetrag: 5,00 €', true); return; }
  if (amount > 100000) { showToast('Maximalbetrag: 1.000,00 €', true); return; }

  const btn = document.getElementById('topupConfirmBtn');
  btn.disabled = true;
  btn.textContent = 'Wird aufgeladen...';

  const user = await clanaAuth.getUser();
  if (!user) { showToast('Nicht angemeldet.', true); btn.disabled = false; updateTopupButton(); return; }

  try {
    // Atomic balance topup via PostgreSQL function (prevents race conditions)
    const { data, error } = await supabaseClient.rpc('atomic_balance_topup', {
      p_user_id: currentUser.id,
      p_amount_cents: amount
    });
    if (error) throw error;

    showToast('Guthaben aufgeladen: ' + formatCents(amount));
    closeTopupModal();
    await loadBillingData();
  } catch (err) {
    Logger.error('topupBalance', err);
    showToast('Aufladung fehlgeschlagen. Bitte versuchen Sie es erneut.', true);
  } finally {
    btn.disabled = false;
    updateTopupButton();
  }
}

async function saveAutoReloadSettings() {
  const user = await clanaAuth.getUser();
  if (!user) return;

  const enabled = document.getElementById('autoReloadToggle').checked;
  const threshold = parseInt(document.getElementById('autoReloadThreshold').value);
  const amount = parseInt(document.getElementById('autoReloadAmount').value);

  try {
    await supabaseClient.from('subscriptions').update({
      auto_reload_enabled: enabled,
      auto_reload_threshold_cents: threshold,
      auto_reload_amount_cents: amount
    }).eq('user_id', user.id);
    showToast(enabled ? 'Auto-Aufladung aktiviert' : 'Auto-Aufladung deaktiviert');
  } catch (err) {
    Logger.error('saveAutoReloadSettings', err);
    showToast('Einstellung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.', true);
  }
}

async function saveHardCapSettings() {
  const user = await clanaAuth.getUser();
  if (!user) return;

  const enabled = document.getElementById('hardCapToggle').checked;
  const amount = parseInt(document.getElementById('hardCapAmount').value);

  try {
    await supabaseClient.from('subscriptions').update({
      hard_cap_enabled: enabled,
      hard_cap_cents: amount
    }).eq('user_id', user.id);
    showToast(enabled ? 'Ausgabenlimit auf ' + formatCents(amount) + ' gesetzt' : 'Ausgabenlimit deaktiviert');
    await loadBillingData();
  } catch (err) {
    Logger.error('saveHardCapSettings', err);
    showToast('Einstellung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.', true);
  }
}

async function loadBillingData() {
  const user = await clanaAuth.getUser();
  if (!user) return;

  try {
    // Load billing account
    const { data: account } = await supabaseClient
      .from('subscriptions').select('*').eq('user_id', user.id).single();

    if (!account) return;

    // Balance
    const balance = account.balance_cents || 0;
    document.getElementById('balanceValue').textContent = formatCents(balance);
    document.getElementById('balanceSub').textContent = balance > 0 ? 'Verfügbar' : 'Kein Guthaben vorhanden';

    // Plan minutes usage (subscriptions table field names)
    const used = Math.round(parseFloat(account.used_minutes) || 0);
    const included = account.included_minutes || 0;
    const overage = Math.round(parseFloat(account.overage_minutes) || 0);
    const percent = included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0;
    const remaining = Math.max(0, included - used);

    document.getElementById('minutesUsed').textContent = used;
    document.getElementById('minutesIncluded').textContent = included;
    document.getElementById('minutesBar').style.width = percent + '%';
    document.getElementById('minutesBar').style.background =
      percent >= 90 ? 'linear-gradient(90deg, var(--orange), var(--red))' :
      percent >= 70 ? 'linear-gradient(90deg, var(--pu), var(--orange))' :
      'linear-gradient(90deg, var(--pu), var(--cyan))';
    document.getElementById('minutesPercent').textContent = percent + '% verbraucht';
    document.getElementById('minutesRemaining').textContent = remaining + ' Min. übrig';

    // Overage info
    const overageEl = document.getElementById('overageInfo');
    if (overage > 0) {
      overageEl.style.display = 'block';
      document.getElementById('overageMinutes').textContent = overage;
      document.getElementById('overageCost').textContent = formatCents(overage * OVERAGE_RATE_CENTS);
    } else {
      overageEl.style.display = 'none';
    }

    // Monthly spending
    const planCost = account.plan_price_cents || 0;
    const overageCost = overage * OVERAGE_RATE_CENTS;
    const totalSpending = planCost + overageCost;
    const hardCap = account.hard_cap_cents || 30000;
    const spendPercent = Math.min(100, Math.round((totalSpending / hardCap) * 100));

    document.getElementById('monthlySpending').textContent = formatCents(totalSpending);
    document.getElementById('hardCapDisplay').textContent = formatCents(hardCap);
    document.getElementById('spendingBar').style.width = spendPercent + '%';
    document.getElementById('spendingBar').style.background =
      spendPercent >= 90 ? 'linear-gradient(90deg, var(--orange), var(--red))' :
      'linear-gradient(90deg, var(--green), var(--cyan))';
    document.getElementById('spendingPercent').textContent = spendPercent + '% vom Limit';

    // Auto-reload settings
    document.getElementById('autoReloadToggle').checked = account.auto_reload_enabled || false;
    document.getElementById('autoReloadThreshold').value = account.auto_reload_threshold_cents || 500;
    document.getElementById('autoReloadAmount').value = account.auto_reload_amount_cents || 5000;

    // Hard cap settings
    document.getElementById('hardCapToggle').checked = account.hard_cap_enabled !== false;
    document.getElementById('hardCapAmount').value = account.hard_cap_cents || 30000;

    // Usage stats
    document.getElementById('usageCalls').textContent = '–'; // from calls table
    document.getElementById('usageMinutes').textContent = used + overage;
    document.getElementById('usagePlanCost').textContent = formatCents(planCost);
    document.getElementById('usageOverageCost').textContent = formatCents(overageCost);

    // Load transactions
    await loadTransactions();
  } catch (err) {
    Logger.warn('loadBillingData', 'Billing account might not exist yet', err);
  }
}

async function loadTransactions() {
  const user = await clanaAuth.getUser();
  if (!user) return;

  try {
    const { data, error } = await supabaseClient
      .from('billing_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    document.getElementById('txCount').textContent = (data || []).length;

    const typeLabels = {
      plan_charge: 'Tarifgebühr',
      topup: 'Aufladung',
      auto_reload: 'Auto-Aufladung',
      usage_charge: 'Verbrauch',
      refund: 'Erstattung',
      credit: 'Gutschrift'
    };

    const tbody = document.getElementById('txTableBody');
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--tx3);padding:30px;">Keine Transaktionen vorhanden</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(tx => {
      const isPositive = ['topup', 'auto_reload', 'refund', 'credit'].includes(tx.type);
      const amountColor = isPositive ? 'var(--green)' : 'var(--tx2)';
      const prefix = isPositive ? '+' : '-';
      return `<tr>
        <td>${new Date(tx.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
        <td><span class="status-badge ${isPositive ? 'completed' : 'active'}">${typeLabels[tx.type] || tx.type}</span></td>
        <td>${escHtml(tx.description || '–')}</td>
        <td style="font-weight:700;color:${amountColor};">${prefix}${formatCents(Math.abs(tx.amount_cents))}</td>
        <td style="color:var(--tx3);">${tx.balance_after_cents != null ? formatCents(tx.balance_after_cents) : '–'}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    Logger.warn('loadTransactions', 'Table might not exist yet', err);
  }
}

// ==========================================
// INTEGRATIONS (dashboard view — connectors managed in settings.html#connectors)
// ==========================================
const INTEGRATION_ICONS = {
  sip_trunk: '📞', fritzbox: '📠', rufumleitung: '↪️', eigene_rufnummer: '🔢',
  rest_api: '🔌', pre_call_webhook: '⚡', mid_call_api: '🔄', post_call_webhook: '📤', outbound_api: '📲',
  hubspot: '💼', salesforce: '☁️', pipedrive: '🔄', zoho_crm: '📊', gohighlevel: '🚀',
  google_calendar: '📆', outlook: '📧', cal_com: '🗓️', calendly: '📅', etermin: '🕐',
  doctolib: '🏥', apaleo: '🏨', aleno: '🍽️', opentable: '🛎️',
  shopify: '🛒', jtl: '📦', woocommerce: '🛍️', sap: '🏢', xentral: '⚙️', plentymarkets: '📋', shopware: '🛒',
  lexoffice: '📒', sevdesk: '🧾',
  mailchimp: '📧', activecampaign: '🎯', klaviyo: '🎹', klicktipp: '✉️', typeform: '📝', meta_lead_ads: '📱',
  zendesk: '🎫', freshdesk: '💬', jira: '🐛', autotask: '🔧',
  slack: '💬', teams: '👥', discord: '🎮', email_gateway: '✉️', sms_gateway: '📱',
  airtable: '🗃️', google_sheets: '📊', sql_db: '🗄️', google_maps: '📍',
  notion: '📓', monday: '📋',
  zapier: '⚡', make: '🔧', n8n: '🔗',
  live_web: '🌐', woasi: '🏔️'
};

async function loadIntegrations() {
  const user = await clanaAuth.getUser();
  if (!user) return;

  try {
    const { data: connections } = await supabaseClient
      .from('integrations').select('*').eq('user_id', user.id);

    const connected = connections || [];
    document.getElementById('intConnectedCount').textContent = connected.length + ' verbunden';

    if (connected.length > 0) {
      document.getElementById('intEmptyState').style.display = 'none';
      const list = document.getElementById('intConnectedList');
      list.style.display = 'grid';
      list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
      list.style.gap = '12px';
      list.innerHTML = connected.map(c => {
        const icon = INTEGRATION_ICONS[c.provider] || '🔗';
        const cfg = c.config || {};
        const typeLabel = cfg.type === 'sip' ? 'SIP' : cfg.type === 'webhook' ? 'Webhook' : cfg.type === 'apikey' ? 'API-Key' : cfg.type === 'oauth' ? 'OAuth' : cfg.type === 'forward' ? 'Rufumleitung' : '';
        return `<div style="background:var(--bg3);border:1px solid rgba(74,222,128,.2);border-radius:12px;padding:16px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="font-size:1.2rem;">${icon}</span>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:700;">${escHtml(c.provider_label || c.provider)}</div>
              <div style="font-size:11px;color:var(--tx3);">${escHtml(c.category || '')} · ${typeLabel}</div>
            </div>
            <span class="status-badge completed">Aktiv</span>
          </div>
          <div style="font-size:11px;color:var(--tx3);">
            Verbunden seit: ${c.connected_at ? new Date(c.connected_at).toLocaleDateString('de-DE') : '–'}
            ${c.last_sync_at ? ' · Sync: ' + new Date(c.last_sync_at).toLocaleString('de-DE') : ''}
            ${c.records_synced ? ' · ' + c.records_synced + ' Datensaetze' : ''}
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="btn-sm" onclick="syncIntegration('${c.id}')">Syncen</button>
            <a href="settings.html#connectors" class="btn-secondary" style="font-size:11px;padding:6px 12px;text-decoration:none;">Konfigurieren</a>
          </div>
        </div>`;
      }).join('');
    } else {
      document.getElementById('intEmptyState').style.display = '';
      document.getElementById('intConnectedList').style.display = 'none';
    }

    await loadContacts();
  } catch (err) {
    Logger.warn('loadIntegrations', 'Tables might not exist yet', err);
  }
}

async function loadContacts() {
  const user = await clanaAuth.getUser();
  if (!user) return;

  try {
    const { data, error } = await supabaseClient
      .from('customer_contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);

    if (error) throw error;

    document.getElementById('contactsCount').textContent = (data || []).length;

    const tbody = document.getElementById('contactsTableBody');
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--tx3);padding:30px;">Keine Kontakte vorhanden. Importiere per CSV oder verbinde ein CRM.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(c => `<tr>
      <td style="font-weight:600;">${escHtml(c.first_name || '')} ${escHtml(c.last_name || '')}</td>
      <td>${escHtml(c.company || '–')}</td>
      <td style="font-family:monospace;font-size:12px;">${escHtml(c.phone || '–')}</td>
      <td>${escHtml(c.email || '–')}</td>
      <td><span class="status-badge active">${escHtml(c.source)}</span></td>
      <td>${c.vip ? '⭐' : '–'}</td>
    </tr>`).join('');
  } catch (err) {
    Logger.warn('loadContacts', 'Table might not exist yet', err);
  }
}

async function syncIntegration(integrationId) {
  showToast('Sync gestartet... Daten werden synchronisiert.');
}

async function disconnectIntegration(integrationId) {
  if (!confirm('Integration wirklich trennen? Alle synchronisierten Daten bleiben erhalten.')) return;
  const user = await clanaAuth.getUser();
  if (!user) return;

  try {
    await supabaseClient.from('integrations').delete().eq('id', integrationId).eq('user_id', user.id);
    showToast('Integration getrennt.');
    await loadIntegrations();
  } catch (err) {
    Logger.error('disconnectIntegration', err);
    showToast('Integration konnte nicht getrennt werden. Bitte versuchen Sie es erneut.', true);
  }
}

// CSV Import
let csvParsedData = [];

function openContactImport() {
  document.getElementById('csvImportModal').style.display = 'flex';
  csvParsedData = [];
  document.getElementById('csvPreview').style.display = 'none';
  document.getElementById('csvImportBtn').disabled = true;
  document.getElementById('csvFileInput').value = '';
}

function closeCsvImportModal() {
  document.getElementById('csvImportModal').style.display = 'none';
}

function handleCsvFile(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('CSV-Datei darf maximal 5 MB gross sein.', true);
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) { showToast('CSV-Datei ist leer oder hat nur Header.', true); return; }

    const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/"/g, ''));
    csvParsedData = lines.slice(1).map(line => {
      const values = line.split(/[,;]/).map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, i) => { obj[h.toLowerCase()] = values[i] || ''; });
      return obj;
    }).filter(row => Object.values(row).some(v => v));

    if (csvParsedData.length > 5000) {
      showToast('Maximal 5.000 Zeilen erlaubt. Die Datei enthält ' + csvParsedData.length + ' Zeilen.', true);
      csvParsedData = [];
      return;
    }

    document.getElementById('csvRowCount').textContent = csvParsedData.length;
    document.getElementById('csvPreview').style.display = 'block';

    const previewHtml = '<table style="width:100%;font-size:12px;"><thead><tr>' +
      headers.map(h => '<th style="padding:6px 8px;text-align:left;">' + escHtml(h) + '</th>').join('') +
      '</tr></thead><tbody>' +
      csvParsedData.slice(0, 5).map(row =>
        '<tr>' + headers.map(h => '<td style="padding:4px 8px;">' + escHtml(row[h.toLowerCase()] || '') + '</td>').join('') + '</tr>'
      ).join('') +
      (csvParsedData.length > 5 ? '<tr><td colspan="' + headers.length + '" style="padding:6px 8px;color:var(--tx3);">... und ' + (csvParsedData.length - 5) + ' weitere</td></tr>' : '') +
      '</tbody></table>';

    document.getElementById('csvPreviewTable').innerHTML = previewHtml;
    document.getElementById('csvImportBtn').disabled = false;
  };
  reader.readAsText(file);
}

function stripHtml(str) {
  if (!str) return str;
  return str.replace(/<[^>]*>/g, '').trim();
}

async function importCsvContacts() {
  if (csvParsedData.length === 0) return;

  const btn = document.getElementById('csvImportBtn');
  btn.disabled = true;
  btn.textContent = 'Importiere...';

  const user = await clanaAuth.getUser();
  if (!user) { showToast('Nicht angemeldet.', true); return; }

  try {
    const contacts = csvParsedData.map(row => ({
      user_id: user.id,
      first_name: stripHtml(row.vorname || row.first_name || row.firstname || ''),
      last_name: stripHtml(row.nachname || row.last_name || row.lastname || ''),
      company: stripHtml(row.firma || row.company || row.unternehmen || ''),
      phone: stripHtml(row.telefon || row.phone || row.tel || row.nummer || ''),
      email: stripHtml(row.email || row['e-mail'] || ''),
      source: 'csv_import',
      notes: stripHtml(row.notizen || row.notes || '')
    }));

    const { error } = await supabaseClient.from('customer_contacts').insert(contacts);
    if (error) throw error;

    showToast(contacts.length + ' Kontakte importiert!');
    closeCsvImportModal();
    await loadContacts();
  } catch (err) {
    Logger.error('importCsvContacts', err);
    showToast('Import fehlgeschlagen. Bitte versuchen Sie es erneut.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Importieren';
  }
}

// Drag & drop for CSV
document.getElementById('csvDropZone')?.addEventListener('dragover', function(e) {
  e.preventDefault();
  this.style.borderColor = 'var(--pu)';
  this.style.background = 'rgba(124,58,237,.04)';
});
document.getElementById('csvDropZone')?.addEventListener('dragleave', function() {
  this.style.borderColor = 'var(--border)';
  this.style.background = '';
});
document.getElementById('csvDropZone')?.addEventListener('drop', function(e) {
  e.preventDefault();
  this.style.borderColor = 'var(--border)';
  this.style.background = '';
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) {
    document.getElementById('csvFileInput').files = e.dataTransfer.files;
    handleCsvFile(document.getElementById('csvFileInput'));
  } else {
    showToast('Bitte eine CSV-Datei verwenden.', true);
  }
});

// ==========================================
// PAYMENT METHODS
// ==========================================
let currentPmPriority = 1;
let currentPmType = 'sepa';

function selectPaymentType(type) {
  currentPmType = type;
  document.querySelectorAll('.pm-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  document.getElementById('formSepa').style.display = type === 'sepa' ? 'block' : 'none';
  document.getElementById('formCard').style.display = type === 'credit_card' ? 'block' : 'none';
  document.getElementById('formPaypal').style.display = type === 'paypal' ? 'block' : 'none';
}

function openPaymentModal(priority) {
  currentPmPriority = priority;
  document.getElementById('pmModalTitle').textContent =
    priority === 1 ? 'Primäre Zahlungsmethode' : 'Ersatz-Zahlungsmethode';
  // Reset forms
  document.querySelectorAll('#paymentModal input').forEach(i => { i.value = ''; if (i.type === 'checkbox') i.checked = false; });
  selectPaymentType('sepa');
  document.getElementById('ibanHint').textContent = '';
  document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
}

// IBAN formatting and validation
document.getElementById('sepaIban')?.addEventListener('input', function() {
  let v = this.value.replace(/\s/g, '').toUpperCase();
  // Format with spaces every 4 chars
  this.value = v.replace(/(.{4})/g, '$1 ').trim();

  const hint = document.getElementById('ibanHint');
  if (v.length >= 2) {
    const country = v.substring(0, 2);
    const countries = { DE: 'Deutschland (22 Zeichen)', AT: 'Österreich (20 Zeichen)', CH: 'Schweiz (21 Zeichen)', LU: 'Luxemburg (20 Zeichen)', NL: 'Niederlande (18 Zeichen)' };
    hint.textContent = countries[country] || '';
    hint.style.color = 'var(--tx3)';
  } else {
    hint.textContent = '';
  }
});

// Card number formatting
document.getElementById('cardNumber')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g, '').substring(0, 16);
  this.value = v.replace(/(.{4})/g, '$1 ').trim();
});

// Card expiry formatting
document.getElementById('cardExpiry')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
  this.value = v;
});

function validateIban(iban) {
  const clean = iban.replace(/\s/g, '');
  if (clean.length < 15 || clean.length > 34) return false;
  if (!/^[A-Z]{2}\d{2}/.test(clean)) return false;
  // Basic checksum: move first 4 chars to end, convert letters to numbers
  const rearranged = clean.substring(4) + clean.substring(0, 4);
  const numStr = rearranged.replace(/[A-Z]/g, c => (c.charCodeAt(0) - 55).toString());
  // Modulo 97 check
  let remainder = 0;
  for (let i = 0; i < numStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numStr[i])) % 97;
  }
  return remainder === 1;
}

async function savePaymentMethod() {
  const btn = document.getElementById('pmSaveBtn');
  const user = await clanaAuth.getUser();
  if (!user) { showToast('Nicht angemeldet.', true); return; }

  let paymentData = { user_id: user.id, type: currentPmType, priority: currentPmPriority, status: 'active' };

  if (currentPmType === 'sepa') {
    const holder = document.getElementById('sepaHolder').value.trim();
    const iban = document.getElementById('sepaIban').value.replace(/\s/g, '').toUpperCase();
    const bic = document.getElementById('sepaBic').value.trim().toUpperCase();
    const consent = document.getElementById('sepaConsent').checked;

    if (!holder) { showToast('Bitte Kontoinhaber eingeben.', true); return; }
    if (!validateIban(iban)) { showToast('Ungültige IBAN. Bitte prüfe die Eingabe.', true); return; }
    if (!consent) { showToast('Bitte bestätige das SEPA-Lastschriftmandat.', true); return; }

    paymentData.account_holder = holder;
    paymentData.iban = iban;
    paymentData.bic = bic || null;
    paymentData.mandate_reference = 'CLANA-' + Date.now().toString(36).toUpperCase();
    paymentData.mandate_date = new Date().toISOString();
    paymentData.mandate_confirmed = true;

  } else if (currentPmType === 'credit_card') {
    const holder = document.getElementById('cardHolder').value.trim();
    const number = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiry = document.getElementById('cardExpiry').value.trim();
    const cvc = document.getElementById('cardCvc').value.trim();

    if (!holder) { showToast('Bitte Karteninhaber eingeben.', true); return; }
    if (number.length < 13 || number.length > 19) { showToast('Ungültige Kartennummer.', true); return; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { showToast('Ungültiges Ablaufdatum (MM/YY).', true); return; }
    if (cvc.length < 3) { showToast('Ungültiger CVC.', true); return; }

    paymentData.account_holder = holder;
    paymentData.card_last4 = number.slice(-4);
    paymentData.card_brand = detectCardBrand(number);
    paymentData.card_expiry = expiry;

  } else if (currentPmType === 'paypal') {
    const email = document.getElementById('paypalEmail').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Ungültige PayPal E-Mail.', true); return; }
    paymentData.paypal_email = email;
    paymentData.account_holder = email;
  }

  btn.disabled = true;
  btn.textContent = 'Wird gespeichert...';

  try {
    // Delete existing method at this priority first
    await supabaseClient.from('payment_methods').delete().eq('user_id', user.id).eq('priority', currentPmPriority);

    const { error } = await supabaseClient.from('payment_methods').insert([paymentData]);
    if (error) throw error;

    showToast('Zahlungsmethode gespeichert!');
    closePaymentModal();
    await loadPaymentMethods();
  } catch (err) {
    Logger.error('savePaymentMethod', err);
    showToast('Zahlungsmethode konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Zahlungsmethode speichern';
  }
}

async function removePaymentMethod(priority) {
  if (!confirm('Zahlungsmethode wirklich entfernen?')) return;
  const user = await clanaAuth.getUser();
  if (!user) return;

  try {
    const { error } = await supabaseClient.from('payment_methods').delete().eq('user_id', user.id).eq('priority', priority);
    if (error) throw error;
    showToast('Zahlungsmethode entfernt.');
    await loadPaymentMethods();
  } catch (err) {
    Logger.error('removePaymentMethod', err);
    showToast('Zahlungsmethode konnte nicht entfernt werden. Bitte versuchen Sie es erneut.', true);
  }
}

async function loadPaymentMethods() {
  const user = await clanaAuth.getUser();
  if (!user) return;

  try {
    const { data, error } = await supabaseClient.from('payment_methods').select('*').eq('user_id', user.id).order('priority');
    if (error) throw error;

    [1, 2].forEach(p => {
      const pm = (data || []).find(m => m.priority === p);
      const empty = document.getElementById('pm' + p + 'Empty');
      const card = document.getElementById('pm' + p + 'Card');
      const badge = document.getElementById('pm' + p + 'Badge');

      if (pm) {
        empty.style.display = 'none';
        card.style.display = 'block';
        badge.textContent = pm.status === 'active' ? 'Aktiv' : pm.status;

        const typeLabels = { sepa: 'SEPA-Lastschrift', credit_card: 'Kreditkarte', paypal: 'PayPal' };
        document.getElementById('pm' + p + 'Type').textContent = typeLabels[pm.type] || pm.type;

        const statusEl = document.getElementById('pm' + p + 'Status');
        statusEl.textContent = pm.status === 'active' ? 'Aktiv' : pm.status === 'pending' ? 'Ausstehend' : pm.status;
        statusEl.className = 'status-badge ' + (pm.status === 'active' ? 'active' : pm.status === 'pending' ? 'voicemail' : 'missed');

        if (pm.type === 'sepa') {
          document.getElementById('pm' + p + 'Info').textContent = maskIban(pm.iban);
          document.getElementById('pm' + p + 'Detail').textContent = pm.account_holder + (pm.mandate_reference ? ' · Mandat: ' + pm.mandate_reference : '');
        } else if (pm.type === 'credit_card') {
          document.getElementById('pm' + p + 'Info').textContent = (pm.card_brand || 'Karte') + ' •••• ' + pm.card_last4;
          document.getElementById('pm' + p + 'Detail').textContent = pm.account_holder + ' · Gültig bis ' + pm.card_expiry;
        } else if (pm.type === 'paypal') {
          document.getElementById('pm' + p + 'Info').textContent = pm.paypal_email;
          document.getElementById('pm' + p + 'Detail').textContent = 'PayPal-Konto';
        }
      } else {
        empty.style.display = '';
        card.style.display = 'none';
        badge.textContent = p === 1 ? 'Nicht hinterlegt' : 'Optional';
      }
    });
  } catch (err) {
    Logger.warn('loadPaymentMethods', 'Table might not exist yet', err);
  }
}

function maskIban(iban) {
  if (!iban || iban.length < 8) return iban;
  return iban.substring(0, 4) + ' •••• •••• ' + iban.slice(-4);
}

function detectCardBrand(number) {
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'Amex';
  return 'Karte';
}

// Load data when navigating to billing/payment pages
const origNavigate = navigateToPage;
navigateToPage = function(page, updateHash) {
  origNavigate(page, updateHash);
  if (page === 'payment') loadPaymentMethods();
  if (page === 'billing') loadBillingData();
  if (page === 'integrations') loadIntegrations();
};
// Also load on initial hash
if (window.location.hash === '#payment') loadPaymentMethods();
if (window.location.hash === '#billing') loadBillingData();
if (window.location.hash === '#integrations') loadIntegrations();
