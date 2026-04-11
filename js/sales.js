// Sales CRM — extracted from sales.html inline script
const PIPELINE_STAGES = [
  { key: 'new', label: 'Neu', color: 'var(--cyan)' },
  { key: 'contacted', label: 'Kontaktiert', color: 'var(--pu3)' },
  { key: 'qualified', label: 'Qualifiziert', color: 'var(--orange)' },
  { key: 'proposal', label: 'Angebot', color: 'var(--green)' },
  { key: 'won', label: 'Gewonnen', color: '#10b981' },
  { key: 'lost', label: 'Verloren', color: 'var(--red)' }
];

// Shared state on window for cross-file access in ESM bundles
window.window.currentProfile = window.window.currentProfile || null;
window.window.allLeads = window.window.allLeads || [];
window.window.allTasks = window.window.allTasks || [];

// Window exports for cross-file access
window.switchTab = switchTab;
window.loadLeads = loadLeads;
window.loadAllData = loadAllData;
window.renderPipeline = renderPipeline;
window.renderLeadsTable = renderLeadsTable;
window.updateLeadStats = updateLeadStats;
window.saveLead = saveLead;
window.clearLeadForm = clearLeadForm;
window.viewLead = viewLead;
window.openEmailTemplate = openEmailTemplate;
window.renderFunnel = renderFunnel;
window.exportCustomersCSV = exportCustomersCSV;

async function init() {
  window.currentProfile = await AuthGuard.requireSales();
  if (!window.currentProfile) return;

  await Components.loadSidebar('sidebar-container', window.currentProfile);

  document.getElementById('sidebar-logout')?.addEventListener('click', async () => {
    await clanaAuth.signOut();
    window.location.href = 'login.html';
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const hash = window.location.hash.replace('#', '') || 'pipeline';
  switchTab(hash);

  // Button listeners
  document.getElementById('btn-add-lead-pipeline')?.addEventListener('click', () => openModal('modal-add-lead'));
  document.getElementById('btn-add-lead')?.addEventListener('click', () => openModal('modal-add-lead'));
  document.getElementById('btn-add-task')?.addEventListener('click', () => {
    // Populate lead dropdown
    const sel = document.getElementById('task-lead');
    sel.innerHTML = '<option value="">Kein Lead</option>' + window.allLeads.map(l => `<option value="${l.id}">${clanaUtils.sanitizeHtml(l.company_name)}</option>`).join('');
    openModal('modal-add-task');
  });
  document.getElementById('btn-set-avail')?.addEventListener('click', () => {
    document.getElementById('avail-date').value = new Date().toISOString().split('T')[0];
    openModal('modal-avail');
  });
  document.getElementById('btn-save-lead')?.addEventListener('click', saveLead);
  document.getElementById('btn-save-task')?.addEventListener('click', () => { if (window.saveTask) window.saveTask(); });
  document.getElementById('btn-save-avail')?.addEventListener('click', () => { if (window.saveAvailability) window.saveAvailability(); });

  // Duplicate detection on lead email
  document.getElementById('lead-email')?.addEventListener('blur', async function() {
    const email = this.value.trim();
    if (!email) return;
    const result = await clanaDB.checkDuplicate(email);
    const warn = document.getElementById('lead-dup-warning');
    if (warn && result.duplicates?.length) {
      const labels = result.duplicates.map(d => `${d.type === 'lead' ? 'Lead' : 'Kunde'}: ${d.company_name}`).join(', ');
      warn.textContent = '⚠️ Duplikat gefunden: ' + labels;
      warn.style.display = 'block';
    } else if (warn) {
      warn.style.display = 'none';
    }
  });

  // Keyboard shortcuts
  const n = () => { openModal('modal-add-lead'); }; n._description = 'Neuer Lead';
  const k = () => { switchTab('customers'); }; k._description = 'Kunden';
  const p = () => { switchTab('pipeline'); }; p._description = 'Pipeline';
  KeyboardShortcuts.init({ n, k, p });

  // Realtime: auto-refresh when data changes
  clanaDB.subscribeTable('leads', () => { loadLeads(); });
  clanaDB.subscribeTable('tasks', () => { if (window.loadTasks) window.loadTasks(); });
  clanaDB.subscribeTable('customers', () => { if (window.customersLoaded && window.loadCustomers) window.loadCustomers(); });

  // Notification center
  if (typeof NotificationCenter !== 'undefined') NotificationCenter.init(window.currentProfile);

  loadAllData();
}

const VALID_SALES_TABS = ['pipeline', 'leads', 'tasks', 'customers', 'availability', 'commission'];

function switchTab(tab) {
  if (!VALID_SALES_TABS.includes(tab)) tab = 'pipeline';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById('tab-' + tab);
  if (section) section.classList.add('active');
  const labels = { pipeline: 'Pipeline', leads: 'Leads', tasks: 'Aufgaben', customers: 'Kunden', availability: 'Verfügbarkeit', commission: 'Provisionen' };
  document.getElementById('breadcrumb-page').textContent = labels[tab] || tab;
  window.location.hash = tab;
  if (tab === 'commission' && window.loadCommissions) window.loadCommissions();
  if (tab === 'customers' && !window.customersLoaded) { if (window.loadCustomers) window.loadCustomers(); if (window.loadCustomerTags) window.loadCustomerTags(); }
  if (tab === 'availability' && typeof AvailabilityModule !== 'undefined') AvailabilityModule.init();
}

async function loadAllData() {
  await Promise.all([loadLeads(), window.loadTasks ? window.loadTasks() : Promise.resolve(), window.loadAvailability ? window.loadAvailability() : Promise.resolve()]);
}

async function loadLeads() {
  const result = await clanaDB.getLeads();
  if (!result.success) { Components.toast('Fehler beim Laden der Leads', 'error'); return; }
  window.allLeads = result.data || [];
  // Auto-calculate scores for leads without score
  window.allLeads.forEach(l => {
    if (!l.score) {
      const { score } = clanaDB.calculateLeadScore(l);
      l.score = score;
    }
  });
  renderPipeline();
  renderLeadsTable();
  updateLeadStats();

  // CRM enhancements
  if (typeof CRMEnhancements !== 'undefined') {
    CRMEnhancements.renderFollowUpBanner(document.getElementById('followup-banner'), window.allLeads);
    CRMEnhancements.renderForecastWidget(document.getElementById('deal-forecast-widget'), window.allLeads);
  }

  // Feed follow-up reminders with already-loaded leads (no extra DB call)
  if (typeof NotificationCenter !== 'undefined') {
    NotificationCenter.checkFollowUpReminders(window.allLeads);
  }
}

function renderPipeline() {
  const board = document.getElementById('pipeline-board');
  board.innerHTML = PIPELINE_STAGES.map(stage => {
    const stageLeads = window.allLeads.filter(l => l.status === stage.key);
    return `
      <div class="kanban-column" data-stage="${stage.key}" ondragover="event.preventDefault();this.style.background='rgba(124,58,237,.08)'" ondragleave="this.style.background=''" ondrop="dropLead(event,'${stage.key}');this.style.background=''">
        <div class="kanban-header">
          <span class="kanban-title" style="color:${stage.color}">${stage.label}</span>
          <span class="kanban-count">${stageLeads.length}</span>
        </div>
        ${stageLeads.length ? stageLeads.map(lead => `
          <div class="kanban-card" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','${clanaUtils.sanitizeAttr(lead.id)}')" data-action="view-lead" data-id="${clanaUtils.sanitizeAttr(lead.id)}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="kanban-card-title">${clanaUtils.sanitizeHtml(lead.company_name)}</div>
              ${lead.score ? `<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:${lead.score>=70?'#10b98122':lead.score>=40?'#f59e0b22':'#ef444422'};color:${lead.score>=70?'#10b981':lead.score>=40?'#f59e0b':'#ef4444'};">${lead.score}</span>` : ''}
            </div>
            ${lead.value ? `<div class="lead-value">${Number(lead.value).toLocaleString('de-DE')} €</div>` : ''}
            ${lead.contact_name ? `<div class="lead-contact">${clanaUtils.sanitizeHtml(lead.contact_name)}</div>` : ''}
          </div>
        `).join('') : '<div style="text-align:center;color:var(--tx3);font-size:12px;padding:20px;">Keine Leads</div>'}
      </div>
    `;
  }).join('');

  // Render stage value bars
  const stageValuesEl = document.getElementById('stage-value-bars');
  if (stageValuesEl) {
    const stageValues = PIPELINE_STAGES.filter(s => s.key !== 'lost').map(stage => {
      const leads = window.allLeads.filter(l => l.status === stage.key);
      const total = leads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
      return { label: stage.label, color: stage.color, value: total, count: leads.length };
    });
    const maxVal = Math.max(...stageValues.map(s => s.value), 1);
    stageValuesEl.innerHTML = stageValues.map(s => {
      const pct = Math.round((s.value / maxVal) * 100);
      return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<span style="font-size:12px;font-weight:600;color:var(--tx2);min-width:90px;">' + s.label + ' (' + s.count + ')</span>' +
        '<div style="flex:1;height:10px;background:var(--bg3);border-radius:5px;overflow:hidden;">' +
          '<div style="width:' + pct + '%;height:100%;background:' + s.color + ';border-radius:5px;transition:width .3s;"></div>' +
        '</div>' +
        '<span style="font-size:12px;font-weight:700;color:var(--tx);min-width:70px;text-align:right;">' + s.value.toLocaleString('de-DE') + ' €</span>' +
      '</div>';
    }).join('');
  }
}

async function dropLead(event, newStage) {
  event.preventDefault();
  const leadId = event.dataTransfer.getData('text/plain');
  if (!leadId) return;
  const lead = window.allLeads.find(l => l.id === leadId);
  if (!lead || lead.status === newStage) return;

  const result = await clanaDB.updateLead(leadId, { status: newStage });
  if (result.success) {
    Components.toast('Lead verschoben: ' + PIPELINE_STAGES.find(s => s.key === newStage)?.label, 'success');
    lead.status = newStage;
    renderPipeline();
    renderLeadsTable();
    updateLeadStats();
    // Offer lead-to-customer conversion when moved to "won"
    if (newStage === 'won') {
      setTimeout(() => { if (window.convertCurrentLeadToCustomer) window.convertCurrentLeadToCustomer(leadId); }, 500);
    }
  } else {
    Components.toast('Fehler: ' + result.error, 'error');
  }
}

function renderLeadsTable() {
  const tbody = document.getElementById('leads-tbody');
  const search = (document.getElementById('lead-search')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('lead-status-filter')?.value || '';

  // Populate status filter options
  const statusSel = document.getElementById('lead-status-filter');
  if (statusSel && statusSel.options.length <= 1) {
    PIPELINE_STAGES.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.key;
      opt.textContent = s.label;
      statusSel.appendChild(opt);
    });
    statusSel.addEventListener('change', renderLeadsTable);
    document.getElementById('lead-search')?.addEventListener('input', renderLeadsTable);
  }

  const filtered = window.allLeads.filter(l => {
    if (search && !(l.company_name || '').toLowerCase().includes(search) && !(l.contact_name || '').toLowerCase().includes(search) && !(l.email || '').toLowerCase().includes(search)) return false;
    if (statusFilter && l.status !== statusFilter) return false;
    return true;
  });

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">' + (window.allLeads.length ? 'Keine Ergebnisse für diesen Filter.' : 'Keine Leads vorhanden. Erstelle deinen ersten Lead!') + '</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(l => {
    const stageInfo = PIPELINE_STAGES.find(s => s.key === l.status) || PIPELINE_STAGES[0];
    return `
      <tr>
        <td><strong>${clanaUtils.sanitizeHtml(l.company_name)}</strong></td>
        <td>${clanaUtils.sanitizeHtml(l.contact_name || '—')}<br>${l.email ? `<a href="${clanaUtils.safeMailHref(l.email)}" style="font-size:11px;color:var(--cyan);text-decoration:none;">${clanaUtils.sanitizeHtml(l.email)}</a>` : ''}</td>
        <td><span class="badge" style="background:${stageInfo.color}22;color:${stageInfo.color}">${stageInfo.label}</span></td>
        <td>${l.value ? Number(l.value).toLocaleString('de-DE') + ' €' : '—'}</td>
        <td>${l.profiles ? `${l.profiles.first_name || ''} ${l.profiles.last_name || ''}` : '—'}</td>
        <td>${l.score ? `<span style="font-weight:700;color:${l.score>=70?'#10b981':l.score>=40?'#f59e0b':'#ef4444'}">${l.score}</span>` : '—'}</td>
        <td>${clanaUtils.formatDate(l.created_at)}</td>
        <td><button class="btn btn-sm btn-outline" data-action="view-lead" data-id="${clanaUtils.sanitizeAttr(l.id)}">Details</button></td>
      </tr>
    `;
  }).join('');
}

function updateLeadStats() {
  const won = window.allLeads.filter(l => l.status === 'won');
  const active = window.allLeads.filter(l => !['won', 'lost'].includes(l.status));
  const pipelineValue = active.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const conversionRate = window.allLeads.length ? Math.round((won.length / window.allLeads.length) * 100) : 0;

  document.getElementById('stat-total-leads').textContent = window.allLeads.length;
  document.getElementById('stat-won').textContent = won.length;
  document.getElementById('stat-pipeline-value').textContent = pipelineValue.toLocaleString('de-DE') + ' €';
  document.getElementById('stat-conversion').textContent = conversionRate + '%';

  // Conversion Funnel
  renderFunnel();
  renderWonLostChart();
}

function renderWonLostChart() {
  const container = document.getElementById('won-lost-chart');
  if (!container) return;
  const days = Number(document.getElementById('pipeline-period')?.value || 30);
  const cutoff = new Date(Date.now() - days * 86400000);

  const recent = window.allLeads.filter(l => new Date(l.updated_at || l.created_at) >= cutoff);
  const won = recent.filter(l => l.status === 'won');
  const lost = recent.filter(l => l.status === 'lost');
  const wonVal = won.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const lostVal = lost.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const maxVal = Math.max(wonVal, lostVal, 1);

  container.innerHTML = `
    <div style="flex:1;text-align:center;">
      <div style="background:#10b981;border-radius:8px 8px 0 0;height:${Math.round((wonVal / maxVal) * 100)}px;margin:0 auto;width:60%;min-height:4px;transition:height .3s;"></div>
      <div style="margin-top:8px;font-size:12px;font-weight:700;color:#10b981;">${won.length} Won</div>
      <div style="font-size:11px;color:var(--tx3);">${wonVal.toLocaleString('de-DE')} €</div>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="background:#ef4444;border-radius:8px 8px 0 0;height:${Math.round((lostVal / maxVal) * 100)}px;margin:0 auto;width:60%;min-height:4px;transition:height .3s;"></div>
      <div style="margin-top:8px;font-size:12px;font-weight:700;color:#ef4444;">${lost.length} Lost</div>
      <div style="font-size:11px;color:var(--tx3);">${lostVal.toLocaleString('de-DE')} €</div>
    </div>
  `;
}

// Email Template quick-action
async function openEmailTemplate(leadOrCustomer) {
  const result = await clanaDB.getEmailTemplates();
  if (!result.success || !result.data?.length) {
    Components.toast('Keine E-Mail-Templates vorhanden', 'info');
    return;
  }
  const templates = result.data;
  const name = leadOrCustomer.contact_name || '';
  const firma = leadOrCustomer.company_name || '';
  const branche = CONFIG.getIndustryLabel(leadOrCustomer.industry);
  const plan = CONFIG.getPlanLabel(leadOrCustomer.plan || 'starter');
  const preis = CONFIG.getPlanPrice(leadOrCustomer.plan || 'starter');

  // Show template picker
  const list = templates.map(t => `<div style="padding:10px;border:1px solid var(--border);border-radius:8px;cursor:pointer;margin-bottom:6px;transition:background .15s;" class="template-pick-item" data-action="use-template" data-id="${clanaUtils.sanitizeAttr(t.id)}">
    <div style="font-weight:600;font-size:13px;">${clanaUtils.sanitizeHtml(t.name)}</div>
    <div style="font-size:11px;color:var(--tx3);">${clanaUtils.sanitizeHtml(t.category)}</div>
  </div>`).join('');

  // Store context for template use
  window._emailCtx = { name, firma, branche, plan, preis, email: leadOrCustomer.email };

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-email-templates';
  overlay.style.display = 'flex';
  overlay.innerHTML = `<div class="modal" style="max-width:440px;">
    <div class="modal-header"><h3 class="modal-title">E-Mail Template wählen</h3><button class="modal-close" data-close-modal="modal-email-templates">&times;</button></div>
    <div style="max-height:350px;overflow-y:auto;">${list}</div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal('modal-email-templates'); });
}

async function useEmailTemplate(templateId) {
  const result = await clanaDB.getEmailTemplates();
  const tpl = result.data?.find(t => t.id === templateId);
  if (!tpl) return;
  const ctx = window._emailCtx || {};

  let subject = tpl.subject.replace(/\{\{kontakt\}\}/g, ctx.name).replace(/\{\{firma\}\}/g, ctx.firma).replace(/\{\{branche\}\}/g, ctx.branche).replace(/\{\{plan\}\}/g, ctx.plan).replace(/\{\{preis\}\}/g, ctx.preis);
  let body = tpl.body.replace(/\{\{kontakt\}\}/g, ctx.name).replace(/\{\{firma\}\}/g, ctx.firma).replace(/\{\{branche\}\}/g, ctx.branche).replace(/\{\{plan\}\}/g, ctx.plan).replace(/\{\{preis\}\}/g, ctx.preis);

  const mailto = `mailto:${ctx.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank');
  closeModal('modal-email-templates');
  Components.toast('E-Mail-Entwurf geöffnet', 'success');
}

function renderFunnel() {
  const funnel = document.getElementById('conversion-funnel');
  if (!funnel) return;
  const total = window.allLeads.length || 1;
  const funnelStages = PIPELINE_STAGES.filter(s => s.key !== 'lost');
  const stageCounts = funnelStages.map(s => ({ ...s, count: window.allLeads.filter(l => l.status === s.key).length }));

  funnel.innerHTML = '<div style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Conversion Funnel</div>' +
    '<div style="display:flex;gap:4px;align-items:end;height:32px;">' +
    stageCounts.map(s => {
      const pct = Math.max((s.count / total) * 100, 3);
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
        <span style="font-size:10px;font-weight:700;color:var(--tx2);">${s.count}</span>
        <div style="width:100%;height:${pct}%;min-height:4px;max-height:32px;background:${s.color};border-radius:4px;opacity:0.8;"></div>
        <span style="font-size:9px;color:var(--tx3);">${s.label}</span>
      </div>`;
    }).join('<div style="color:var(--tx3);font-size:10px;padding-bottom:14px;">→</div>') +
    '</div>';
}

async function saveLead() {
  const company = document.getElementById('lead-company').value.trim();
  if (!company) { Components.toast('Firma ist erforderlich', 'error'); return; }

  const email = document.getElementById('lead-email').value.trim();
  if (email && !clanaUtils.validateEmail(email)) {
    Components.toast('Ungültige E-Mail-Adresse', 'error');
    return;
  }

  const industry = document.getElementById('lead-industry')?.value || '';

  const saveBtn = document.getElementById('btn-save-lead');
  const editId = saveBtn.dataset.editId;
  saveBtn.disabled = true;
  const origText = saveBtn.textContent;
  saveBtn.textContent = '…';

  const payload = { company_name: company };
  if (industry) payload.industry = industry;

  const contact = document.getElementById('lead-contact').value.trim();
  const phone = document.getElementById('lead-phone').value.trim();
  const value = Number(document.getElementById('lead-value').value);
  const source = document.getElementById('lead-source').value;

  if (contact) payload.contact_name = contact;
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (value > 0) payload.value = value;
  if (source) payload.source = source;

  let result;
  if (editId) {
    result = await clanaDB.updateLead(editId, payload);
  } else {
    const notes = document.getElementById('lead-notes').value.trim();
    if (notes) payload.notes = notes;
    payload.assigned_to = window.currentProfile.id;
    payload.status = 'new';
    result = await clanaDB.createLead(payload);
  }

  if (result.success) {
    Components.toast(editId ? 'Lead aktualisiert' : 'Lead erstellt', 'success');
    closeModal('modal-add-lead');
    clearLeadForm();
    loadLeads();
  } else {
    Components.toast('Fehler: ' + result.error, 'error');
  }
  saveBtn.disabled = false;
  saveBtn.textContent = origText;
  delete saveBtn.dataset.editId;
}

function clearLeadForm() {
  ['lead-company', 'lead-contact', 'lead-email', 'lead-phone', 'lead-value', 'lead-industry', 'lead-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

async function viewLead(id) {
  openModal('modal-lead-detail');
  const container = document.getElementById('lead-detail-content');
  container.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:40px;">Laden...</div>';

  const result = await clanaDB.getLead(id);
  if (!result.success) {
    container.innerHTML = '<div style="text-align:center;color:var(--red);padding:40px;">Fehler beim Laden des Leads.</div>';
    return;
  }

  const lead = result.data;
  const stageInfo = PIPELINE_STAGES.find(s => s.key === lead.status) || PIPELINE_STAGES[0];
  const sourceLabels = { website: 'Website', referral: 'Empfehlung', cold_call: 'Kaltakquise', event: 'Event', other: 'Sonstige' };
  const assignedName = lead.profiles ? `${lead.profiles.first_name || ''} ${lead.profiles.last_name || ''}`.trim() : '—';
  const notes = lead.notes || [];
  notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  container.innerHTML = `
    <div class="lead-detail-header">
      <div>
        <div class="lead-detail-company">${clanaUtils.sanitizeHtml(lead.company_name)}</div>
        <span class="badge" style="background:${stageInfo.color}22;color:${stageInfo.color}">${stageInfo.label}</span>
      </div>
      ${lead.value ? `<div class="lead-value" style="font-size:16px;">${Number(lead.value).toLocaleString('de-DE')} €</div>` : ''}
    </div>

    <div class="lead-detail-meta">
      <div class="lead-detail-meta-item">
        <div class="lead-detail-meta-label">Kontakt</div>
        ${clanaUtils.sanitizeHtml(lead.contact_name || '—')}
      </div>
      <div class="lead-detail-meta-item">
        <div class="lead-detail-meta-label">E-Mail</div>
        ${lead.email ? `<a href="${clanaUtils.safeMailHref(lead.email)}" style="color:var(--cyan);text-decoration:none;">${clanaUtils.sanitizeHtml(lead.email)}</a>` : '—'}
      </div>
      <div class="lead-detail-meta-item">
        <div class="lead-detail-meta-label">Telefon</div>
        ${lead.phone ? `<a href="${clanaUtils.safeTelHref(lead.phone)}" style="color:var(--cyan);text-decoration:none;">${clanaUtils.sanitizeHtml(lead.phone)}</a>` : '—'}
      </div>
      <div class="lead-detail-meta-item">
        <div class="lead-detail-meta-label">Quelle</div>
        ${sourceLabels[lead.source] || lead.source || '—'}
      </div>
      <div class="lead-detail-meta-item">
        <div class="lead-detail-meta-label">Zugewiesen</div>
        ${clanaUtils.sanitizeHtml(assignedName)}
      </div>
      <div class="lead-detail-meta-item">
        <div class="lead-detail-meta-label">Erstellt</div>
        ${clanaUtils.formatDate(lead.created_at)}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Status ändern</label>
      <select class="form-input form-select" id="lead-detail-status">
        ${PIPELINE_STAGES.map(s => `<option value="${s.key}" ${s.key === lead.status ? 'selected' : ''}>${s.label}</option>`).join('')}
      </select>
    </div>

    <div class="lead-detail-section">
      <div class="lead-detail-section-title">Aktivitäten</div>
      <div class="activity-timeline" id="lead-detail-timeline">
        ${notes.length ? notes.map(n => {
          const author = n.profiles ? `${n.profiles.first_name || ''} ${n.profiles.last_name || ''}`.trim() : 'Unbekannt';
          return `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <span class="timeline-author">${clanaUtils.sanitizeHtml(author)}</span>
                <span class="timeline-time">${clanaUtils.formatDate(n.created_at)}</span>
                <div class="timeline-text">${clanaUtils.sanitizeHtml(n.content)}</div>
              </div>
            </div>
          `;
        }).join('') : '<div class="timeline-empty">Noch keine Notizen vorhanden.</div>'}
      </div>
      <div class="note-form">
        <input type="text" class="form-input" id="lead-detail-note" placeholder="Notiz hinzufügen...">
        <button class="btn btn-sm" id="btn-add-note">Senden</button>
      </div>
    </div>

    <div class="lead-detail-actions">
      <button class="btn btn-sm btn-danger" id="btn-delete-lead">Lead löschen</button>
      <button class="btn btn-sm" id="btn-edit-lead">Bearbeiten</button>
    </div>
  `;

  // Status change handler
  document.getElementById('lead-detail-status').addEventListener('change', async (e) => {
    const newStatus = e.target.value;
    const updateResult = await clanaDB.updateLead(lead.id, { status: newStatus });
    if (updateResult.success) {
      Components.toast('Status aktualisiert', 'success');
      await loadLeads();
    } else {
      Components.toast('Fehler: ' + updateResult.error, 'error');
      e.target.value = lead.status;
    }
  });

  // Add note handler
  document.getElementById('btn-add-note').addEventListener('click', async () => {
    const noteInput = document.getElementById('lead-detail-note');
    const content = noteInput.value.trim();
    if (!content) { Components.toast('Notiz darf nicht leer sein', 'error'); return; }

    const noteResult = await clanaDB.createNote({ lead_id: lead.id, content: content });
    if (noteResult.success) {
      Components.toast('Notiz hinzugefügt', 'success');
      noteInput.value = '';
      await viewLead(lead.id);
    } else {
      Components.toast('Fehler: ' + noteResult.error, 'error');
    }
  });

  // Enter key for note input
  document.getElementById('lead-detail-note').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('btn-add-note').click();
    }
  });

  // Delete lead handler
  document.getElementById('btn-delete-lead').addEventListener('click', async () => {
    if (!confirm('Lead wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;

    const deleteResult = await clanaDB.deleteLead(lead.id);
    if (deleteResult.success) {
      Components.toast('Lead gelöscht', 'success');
      closeModal('modal-lead-detail');
      await loadLeads();
    } else {
      Components.toast('Fehler: ' + deleteResult.error, 'error');
    }
  });

  // Edit lead handler
  document.getElementById('btn-edit-lead').addEventListener('click', () => {
    closeModal('modal-lead-detail');
    document.getElementById('lead-company').value = lead.company_name || '';
    document.getElementById('lead-contact').value = lead.contact_name || '';
    document.getElementById('lead-email').value = lead.email || '';
    document.getElementById('lead-phone').value = lead.phone || '';
    document.getElementById('lead-value').value = lead.value || '';
    document.getElementById('lead-source').value = lead.source || '';
    document.getElementById('lead-notes').value = '';
    // Set save button to update mode
    const saveBtn = document.getElementById('btn-save-lead');
    saveBtn.textContent = 'Lead aktualisieren';
    saveBtn.dataset.editId = lead.id;
    openModal('modal-add-lead');
  });
}

// ---- TASKS ----

// Tasks, Availability, Commissions → extracted to js/sales-tasks.js

// openModal/closeModal provided by js/modal.js

// Register safe event delegation actions
if (typeof SafeActions !== 'undefined') {
  SafeActions.registerAll({
    'view-lead': (id) => viewLead(id),
    'use-template': (id, _, el) => useEmailTemplate(id, el.parentElement),
    'toggle-task': (id, extra) => { if (window.toggleTask) window.toggleTask(id, extra); },
    'set-avail': (id) => { if (window.setAvailForDate) window.setAvailForDate(id); },
  });
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// CSS hover for template picker items
(function() {
  var style = document.createElement('style');
  style.textContent = '.template-pick-item:hover{background:var(--bg3)!important;}';
  document.head.appendChild(style);
})();

init();
