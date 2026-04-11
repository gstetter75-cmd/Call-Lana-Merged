// Extracted from dashboard.js — Assistant CRUD, editor, phones
// Depends on: dashboard.js (globals: assistantsList, editingAssistantId, escHtml, showToast, navigateToPage, clanaDB, clanaUtils)
// ==========================================

// ==========================================
// HOME ASSISTANTS (card grid)
// ==========================================
function renderHomeAssistants() {
  const container = document.getElementById('homeAssistants');
  if (assistantsList.length === 0) {
    container.innerHTML = '<div class="assistant-card" data-action="create-assistant" style="display:flex;align-items:center;justify-content:center;min-height:80px;border-style:dashed;cursor:pointer;"><span style="color:var(--tx3);font-size:13px;">+ Neuen Assistenten erstellen</span></div>';
    return;
  }
  container.innerHTML = assistantsList.map(a =>
    '<div class="assistant-card" data-action="edit-assistant" data-id="' + clanaUtils.sanitizeAttr(a.id) + '" style="cursor:pointer;">' +
      '<div class="ac-top">' +
        '<div class="ac-name">' + escHtml(a.name) + '</div>' +
        '<span class="live-badge ' + (a.status === 'live' ? 'live' : 'offline') + '">' + (a.status === 'live' ? 'LIVE' : 'Offline') + '</span>' +
      '</div>' +
      '<div class="ac-phone">' + escHtml(a.phone_number || 'Keine Nummer') + '</div>' +
    '</div>'
  ).join('');
}

// ==========================================
// ASSISTANTS TABLE
// ==========================================
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
      '<td style="font-weight:600;color:var(--tx);cursor:pointer;" data-action="edit-assistant" data-id="' + clanaUtils.sanitizeAttr(a.id) + '">' + escHtml(a.name) + '</td>' +
      '<td><span class="status-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
      '<td>' + escHtml(a.phone_number || '–') + '</td>' +
      '<td>' + escHtml(a.voice || 'Marie') + '</td>' +
      '<td>' + clanaUtils.formatDate(a.created_at) + '</td>' +
      '<td><button data-action="delete-assistant" data-id="' + clanaUtils.sanitizeAttr(a.id) + '" data-extra="' + clanaUtils.sanitizeAttr(a.name) + '" style="background:none;border:1px solid rgba(248,113,113,.3);border-radius:6px;padding:4px 10px;color:var(--red);font-size:11px;cursor:pointer;font-family:inherit;">Löschen</button></td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ==========================================
// PHONES LIST (derived from assistants)
// ==========================================
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

// ==========================================
// LOAD ASSISTANTS
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

// ==========================================
// NEW ASSISTANT
// ==========================================
document.getElementById('btnNewAssistant').addEventListener('click', createNewAssistant);

function createNewAssistant() {
  editingAssistantId = null;
  document.getElementById('editTitle').textContent = 'Neuer Assistent';
  document.getElementById('editDesc').textContent = 'Erstelle einen neuen KI-Assistenten.';
  clearEditorForm();
  navigateToPage('assistant-edit');
}

// ==========================================
// EDIT ASSISTANT
// ==========================================
function editAssistant(id) {
  const a = assistantsList.find(x => x.id === id);
  if (!a) return;
  editingAssistantId = id;
  document.getElementById('editTitle').textContent = a.name;
  document.getElementById('editDesc').textContent = 'Konfiguriere deinen Assistenten.';

  document.getElementById('edName').value = a.name || '';
  document.getElementById('edVoice').value = a.voice || 'Marie';
  document.getElementById('edLang').value = a.language || 'de';
  document.getElementById('edPhone').value = a.phone_number || '';
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
  document.getElementById('edPhone').value = '';
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

// ==========================================
// SAVE ASSISTANT
// ==========================================
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
    phone_number: document.getElementById('edPhone').value.trim() || null,
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
// DELETE ASSISTANT
// ==========================================
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
