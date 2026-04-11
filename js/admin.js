// Admin Dashboard — extracted from admin.html inline script
let currentProfile = null;
let editingUserId = null;

async function init() {
  // Force token refresh to pick up latest role metadata
  try {
    const { data: refreshed } = await supabaseClient.auth.refreshSession();
    if (!refreshed?.session) {
      await supabaseClient.auth.signOut();
      window.location.href = 'login.html';
      return;
    }
  } catch (e) { /* ignore */ }

  currentProfile = await AuthGuard.requireSuperadmin();
  if (!currentProfile) return;

  await Components.loadSidebar('sidebar-container', currentProfile);

  // Sidebar logout
  document.getElementById('sidebar-logout')?.addEventListener('click', async () => {
    await clanaAuth.signOut();
    window.location.href = 'login.html';
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Handle hash navigation
  const hash = window.location.hash.replace('#', '') || 'overview';
  switchTab(hash);

  if (window.loadOverview) window.loadOverview();
  loadUsers();
  loadOrgs();
  if (window.loadSystemStats) window.loadSystemStats();
  loadCustomers();

  // Search
  document.getElementById('user-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#users-tbody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });

  // Customer search
  document.getElementById('customer-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#customers-tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Add org
  document.getElementById('btn-add-org')?.addEventListener('click', () => openModal('modal-add-org'));
  document.getElementById('btn-create-org')?.addEventListener('click', createOrg);
  document.getElementById('btn-save-role')?.addEventListener('click', saveUserRole);
}

const VALID_ADMIN_TABS = ['overview', 'analytics', 'onboarding', 'minutes-alert', 'error-log', 'integrations', 'customers', 'users', 'orgs', 'system'];

// Window exports for cross-file access
window.VALID_ADMIN_TABS = VALID_ADMIN_TABS;
window.switchTab = switchTab;
window.loadUsers = loadUsers;
window.loadOrgs = loadOrgs;
window.loadCustomers = loadCustomers;
window.viewCustomer = viewCustomer;
window.editUserRole = editUserRole;
window.saveUserRole = saveUserRole;
window.toggleUserActive = toggleUserActive;
window.createOrg = createOrg;
window.editOrg = editOrg;
window.exportCustomersCSV = exportCustomersCSV;

function switchTab(tab) {
  // Validate tab against whitelist
  if (!VALID_ADMIN_TABS.includes(tab)) tab = 'overview';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById('tab-' + tab);
  if (section) section.classList.add('active');
  const tabLabels = { overview: 'Übersicht', analytics: 'Analytics', onboarding: 'Onboarding', 'minutes-alert': 'Minuten-Alert', 'error-log': 'Fehler-Log', integrations: 'Integrationen', customers: 'Kunden', users: 'Benutzer', orgs: 'Organisationen', system: 'System' };
  document.getElementById('breadcrumb-page').textContent = tabLabels[tab] || tab;
  window.location.hash = tab;

  if (tab === 'system') {
    if (typeof AdminAudit !== 'undefined') {
      AdminAudit.initActivityFeed(document.getElementById('admin-activity-feed'));
      AdminAudit.renderAuditLog(document.getElementById('admin-audit-log'));
    }
    if (typeof SystemHealth !== 'undefined') {
      SystemHealth.renderHealthDashboard(document.getElementById('admin-system-health'));
    }
  }
  if (tab === 'integrations' && typeof IntegrationsHub !== 'undefined') {
    IntegrationsHub.renderStripeSettings(document.getElementById('int-stripe'));
    IntegrationsHub.renderCalendarSync(document.getElementById('int-calendar'));
    IntegrationsHub.renderEmailSettings(document.getElementById('int-email'));
    IntegrationsHub.renderFileUpload(document.getElementById('int-files'));
    IntegrationsHub.renderPhoneSettings(document.getElementById('int-phone'));
  }
  if (tab === 'analytics' && typeof AdminAnalytics !== 'undefined') {
    AdminAnalytics.renderRevenueForecast(document.getElementById('admin-forecast'));
    AdminAnalytics.renderChurnWarnings(document.getElementById('admin-churn'));
    AdminAnalytics.renderCohortAnalysis(document.getElementById('admin-cohorts'));
    AdminAnalytics.renderWebhookConfig(document.getElementById('admin-webhooks'));
  }
  if (typeof AdminExtra !== 'undefined') {
    AdminExtra.initTab(tab);
  }
}

async function loadUsers() {
  const result = await clanaDB.getAllProfiles();
  if (!result.success) {
    Components.toast('Fehler beim Laden der Benutzer', 'error');
    return;
  }
  const tbody = document.getElementById('users-tbody');
  const users = result.data || [];
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Keine Benutzer gefunden</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${clanaUtils.sanitizeHtml(u.first_name || '')} ${clanaUtils.sanitizeHtml(u.last_name || '')}</strong></td>
      <td>${clanaUtils.sanitizeHtml(u.email || '')}</td>
      <td><span class="badge badge-${u.role === 'superadmin' ? 'red' : u.role === 'sales' ? 'orange' : 'green'} role-badge">${u.role}</span></td>
      <td>${u.organizations?.name || '—'}</td>
      <td><span class="badge ${u.is_active ? 'badge-green' : 'badge-red'}">${u.is_active ? 'Aktiv' : 'Gesperrt'}</span></td>
      <td>${clanaUtils.formatDate(u.created_at)}</td>
      <td>
        <div class="user-actions">
          <button data-action="edit-role" data-id="${clanaUtils.sanitizeAttr(u.id)}" data-extra="${clanaUtils.sanitizeAttr(JSON.stringify({email:u.email||'',role:u.role,org:u.organization_id||''}))}">Rolle</button>
          <button data-action="toggle-active" data-id="${clanaUtils.sanitizeAttr(u.id)}" data-extra="${u.is_active}">${u.is_active ? 'Sperren' : 'Aktivieren'}</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function loadOrgs() {
  const result = await clanaDB.getOrganizations();
  if (!result.success) return;
  const tbody = document.getElementById('orgs-tbody');
  const orgs = result.data || [];
  if (!orgs.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Keine Organisationen</td></tr>';
    return;
  }
  tbody.innerHTML = orgs.map(o => `
    <tr>
      <td><strong>${clanaUtils.sanitizeHtml(o.name)}</strong></td>
      <td><span class="badge badge-purple">${o.plan}</span></td>
      <td>${o.profiles ? `${o.profiles.first_name || ''} ${o.profiles.last_name || ''}` : '—'}</td>
      <td>${o.max_users || 1}</td>
      <td><span class="badge ${o.is_active ? 'badge-green' : 'badge-red'}">${o.is_active ? 'Aktiv' : 'Inaktiv'}</span></td>
      <td>${clanaUtils.formatDate(o.created_at)}</td>
      <td>
        <div class="user-actions">
          <button data-action="edit-org" data-id="${clanaUtils.sanitizeAttr(o.id)}">Bearbeiten</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// SystemStats + Overview + MRR Chart → extracted to js/admin-stats.js

// ---- CUSTOMERS ----

async function loadCustomers() {
  const result = await clanaDB.getAllProfiles();
  if (!result.success) return;

  const customers = (result.data || []).filter(u => u.role === 'customer');
  const tbody = document.getElementById('customers-tbody');

  if (!customers.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--tx3);padding:40px;">Keine Kunden gefunden</td></tr>';
    return;
  }

  tbody.innerHTML = customers.map(c => {
    const plan = c.organizations?.plan || 'starter';
    const price = CONFIG.getPlanPrice(plan);

    return `
      <tr>
        <td><strong>${clanaUtils.sanitizeHtml(c.first_name || '')} ${clanaUtils.sanitizeHtml(c.last_name || '')}</strong></td>
        <td>${clanaUtils.sanitizeHtml(c.email || '')}</td>
        <td>${clanaUtils.sanitizeHtml(c.company || c.organizations?.name || '—')}</td>
        <td><span class="badge badge-purple">${plan}</span></td>
        <td>${price.toLocaleString('de-DE')} €</td>
        <td>${clanaUtils.sanitizeHtml(c.industry || '—')}</td>
        <td><span class="badge ${c.is_active !== false ? 'badge-green' : 'badge-red'}">${c.is_active !== false ? 'Aktiv' : 'Inaktiv'}</span></td>
        <td>${clanaUtils.formatDate(c.created_at)}</td>
        <td><button class="btn btn-sm btn-outline" data-action="view-customer" data-id="${clanaUtils.sanitizeAttr(c.id)}">Details</button></td>
      </tr>
    `;
  }).join('');
}

async function viewCustomer(customerId) {
  openModal('modal-customer-detail');
  const container = document.getElementById('customer-detail-content');
  container.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:40px;">Laden...</div>';

  const { data: customer, error } = await supabaseClient
    .from('profiles')
    .select('*, organizations(name, plan)')
    .eq('id', customerId)
    .single();

  if (error || !customer) {
    container.innerHTML = '<div style="text-align:center;color:var(--red);padding:40px;">Fehler beim Laden.</div>';
    return;
  }

  const plan = customer.organizations?.plan || 'starter';
  const price = CONFIG.getPlanPrice(plan);

  // Load usage data
  const [callsRes, assistantsRes] = await Promise.all([
    supabaseClient.from('calls').select('id,duration,status,created_at').eq('user_id', customerId).order('created_at', { ascending: false }).limit(100),
    supabaseClient.from('assistants').select('id,name,status').eq('user_id', customerId)
  ]);
  const calls = callsRes.data || [];
  const assistants = assistantsRes.data || [];
  const totalCalls = calls.length;
  const totalMinutes = Math.round(calls.reduce((s, c) => s + (c.duration || 0), 0) / 60);
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
  const liveAssistants = assistants.filter(a => a.status === 'live').length;

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--pu),var(--pu3));display:flex;align-items:center;justify-content:center;font-size:16px;color:white;font-weight:700;">
        ${((customer.first_name?.[0] || '') + (customer.last_name?.[0] || '')).toUpperCase() || '?'}
      </div>
      <div>
        <div style="font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:700;">${clanaUtils.sanitizeHtml(customer.first_name || '')} ${clanaUtils.sanitizeHtml(customer.last_name || '')}</div>
        <div style="font-size:12px;color:var(--tx3);">${clanaUtils.sanitizeHtml(customer.email || '')}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px;background:var(--bg2);border-radius:12px;margin-bottom:20px;">
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Unternehmen</div>
        <div style="font-size:13px;">${clanaUtils.sanitizeHtml(customer.company || customer.organizations?.name || '—')}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Branche</div>
        <div style="font-size:13px;">${clanaUtils.sanitizeHtml(customer.industry || '—')}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Plan</div>
        <div style="font-size:13px;"><span class="badge badge-purple">${plan}</span></div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Monatl. Umsatz</div>
        <div style="font-size:13px;font-weight:700;color:var(--green);">${price.toLocaleString('de-DE')} €</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Status</div>
        <div><span class="badge ${customer.is_active !== false ? 'badge-green' : 'badge-red'}">${customer.is_active !== false ? 'Aktiv' : 'Inaktiv'}</span></div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Registriert</div>
        <div style="font-size:13px;">${clanaUtils.formatDate(customer.created_at)}</div>
      </div>
    </div>

    <!-- Usage Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
      <div style="background:var(--bg2);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:4px;">Anrufe</div>
        <div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;">${totalCalls}</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:4px;">Minuten</div>
        <div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;">${totalMinutes}</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:4px;">Erfolgsrate</div>
        <div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;color:${successRate >= 80 ? 'var(--green)' : successRate >= 50 ? 'var(--orange)' : 'var(--red)'};">${successRate}%</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:4px;">Assistenten</div>
        <div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;">${liveAssistants}/${assistants.length}</div>
      </div>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-sm" style="background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 0 12px rgba(245,158,11,.3);" data-action="impersonate" data-id="${clanaUtils.sanitizeAttr(customer.id)}">👁 Als Kunde anmelden</button>
      <button class="btn btn-sm btn-outline" data-action="edit-role" data-id="${clanaUtils.sanitizeAttr(customer.id)}" data-extra="${clanaUtils.sanitizeAttr(JSON.stringify({email:customer.email||'',role:customer.role,org:customer.organization_id||''}))}">Rolle ändern</button>
      <button class="btn btn-sm ${customer.is_active !== false ? 'btn-danger' : ''}" data-action="toggle-active" data-id="${clanaUtils.sanitizeAttr(customer.id)}" data-extra="${customer.is_active !== false}">
        ${customer.is_active !== false ? 'Sperren' : 'Aktivieren'}
      </button>
    </div>
  `;
}

// ---- CSV EXPORT ----

function exportCustomersCSV() {
  const rows = document.querySelectorAll('#customers-tbody tr');
  if (!rows.length) { Components.toast('Keine Daten zum Exportieren', 'error'); return; }

  let csv = 'Name,E-Mail,Unternehmen,Plan,Monatl. Netto,Branche,Status,Registriert\n';
  rows.forEach(row => {
    if (row.style.display === 'none') return;
    const cells = row.querySelectorAll('td');
    if (cells.length < 8) return;
    const values = Array.from(cells).slice(0, 8).map(td => '"' + td.textContent.trim().replace(/"/g, '""') + '"');
    csv += values.join(',') + '\n';
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'call-lana-kunden-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  Components.toast('CSV exportiert', 'success');
}

function editUserRole(userId, email, currentRole, currentOrgId) {
  editingUserId = userId;
  document.getElementById('edit-role-user').value = email;
  document.getElementById('edit-role-select').value = currentRole;
  // Load orgs into select
  loadOrgSelect(currentOrgId);
  openModal('modal-edit-role');
}

async function loadOrgSelect(currentOrgId) {
  const result = await clanaDB.getOrganizations();
  const select = document.getElementById('edit-role-org');
  select.innerHTML = '<option value="">Keine</option>';
  if (result.success && result.data) {
    result.data.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.name;
      if (o.id === currentOrgId) opt.selected = true;
      select.appendChild(opt);
    });
  }
}

async function saveUserRole() {
  if (!editingUserId) return;
  if (editingUserId === currentProfile.id) {
    Components.toast('Du kannst deine eigene Rolle nicht ändern.', 'error');
    return;
  }
  const role = document.getElementById('edit-role-select').value;
  const orgId = document.getElementById('edit-role-org').value || null;

  const result = await clanaDB.updateProfile(editingUserId, { role, organization_id: orgId });
  if (result.success) {
    Components.toast('Rolle aktualisiert', 'success');
    if (typeof AdminAudit !== 'undefined') AdminAudit.logAction('role_change', 'profile', editingUserId, null, { role });
    closeModal('modal-edit-role');
    loadUsers();
  } else {
    Components.toast('Fehler: ' + result.error, 'error');
  }
}

async function toggleUserActive(userId, currentlyActive) {
  const result = await clanaDB.updateProfile(userId, { is_active: !currentlyActive });
  if (result.success) {
    Components.toast(currentlyActive ? 'Benutzer gesperrt' : 'Benutzer aktiviert', 'success');
    loadUsers();
  } else {
    Components.toast('Fehler: ' + result.error, 'error');
  }
}

async function createOrg() {
  const name = document.getElementById('org-name').value.trim();
  const plan = document.getElementById('org-plan').value;
  if (!name) { Components.toast('Name ist erforderlich', 'error'); return; }

  const btn = document.getElementById('btn-save-org');
  const editId = btn?.dataset.editId;

  if (editId) {
    // Update existing org
    const { error } = await supabaseClient.from('organizations').update({ name, plan }).eq('id', editId);
    if (error) { Components.toast('Fehler: ' + error.message, 'error'); return; }
    Components.toast('Organisation aktualisiert', 'success');
    delete btn.dataset.editId;
    btn.textContent = 'Erstellen';
  } else {
    // Create new org
    const maxUsers = plan === 'solo' ? 1 : plan === 'team' ? 5 : 999;
    const result = await clanaDB.createOrganization({ name, plan, max_users: maxUsers, owner_id: currentProfile.id });
    if (!result.success) { Components.toast('Fehler: ' + result.error, 'error'); return; }
    Components.toast('Organisation erstellt', 'success');
    if (typeof AdminAudit !== 'undefined') AdminAudit.logAction('org_create', 'organization', null, null, { name, plan });
  }

  closeModal('modal-add-org');
  document.getElementById('org-name').value = '';
  loadOrgs();
  if (window.loadSystemStats) window.loadSystemStats();
}

async function editOrg(orgId) {
  const { data: org } = await supabaseClient.from('organizations').select('*').eq('id', orgId).single();
  if (!org) { Components.toast('Organisation nicht gefunden', 'error'); return; }

  document.getElementById('org-name').value = org.name || '';
  document.getElementById('org-plan').value = org.plan || 'starter';
  document.getElementById('btn-save-org').dataset.editId = orgId;
  document.getElementById('btn-save-org').textContent = 'Speichern';
  openModal('modal-add-org');
}

// openModal/closeModal provided by js/modal.js

// Register safe event delegation actions
if (typeof SafeActions !== 'undefined') {
  SafeActions.registerAll({
    'edit-role': (id, extraJson) => {
      try {
        const d = JSON.parse(extraJson);
        editUserRole(id, d.email, d.role, d.org);
      } catch { /* ignore parse error */ }
    },
    'toggle-active': (id, extra) => toggleUserActive(id, extra === 'true'),
    'edit-org': (id) => editOrg(id),
    'view-customer': (id) => viewCustomer(id),
    'impersonate': (id) => {
      closeModal('modal-customer-detail');
      ImpersonationManager.start(id);
    },
    'gen-invoices': () => { if (typeof AdminAnalytics !== 'undefined') AdminAnalytics.generateMonthlyInvoices(); },
    'export-customers-csv': () => exportCustomersCSV(),
    'export-users-csv': () => { if (typeof AdminOverview !== 'undefined') AdminOverview.exportUsersCSV(); },
    'export-orgs-csv': () => { if (typeof AdminOverview !== 'undefined') AdminOverview.exportOrgsCSV(); },
    'invite-sales-user': () => openModal('modal-invite-sales'),
  });
}

// Invite Sales User
document.getElementById('btn-invite-sales')?.addEventListener('click', async () => {
  const email = document.getElementById('invite-email')?.value?.trim();
  const password = document.getElementById('invite-password')?.value;
  const firstName = document.getElementById('invite-firstname')?.value?.trim();
  const lastName = document.getElementById('invite-lastname')?.value?.trim();
  const company = document.getElementById('invite-company')?.value?.trim();
  const errEl = document.getElementById('invite-error');
  const btn = document.getElementById('btn-invite-sales');

  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

  if (!email || !password) {
    if (errEl) { errEl.textContent = 'E-Mail und Passwort sind Pflichtfelder.'; errEl.style.display = 'block'; }
    return;
  }
  if (password.length < 8) {
    if (errEl) { errEl.textContent = 'Passwort muss mindestens 8 Zeichen lang sein.'; errEl.style.display = 'block'; }
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Wird angelegt…';

  try {
    const session = await supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;

    const resp = await fetch(supabaseClient.supabaseUrl + '/functions/v1/invite-sales-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ email, password, firstName, lastName, company }),
    });

    const result = await resp.json();

    if (!resp.ok || result.error) {
      throw new Error(result.error || 'Unbekannter Fehler');
    }

    Components.toast('Sales-User ' + email + ' erfolgreich angelegt!', 'success');
    closeModal('modal-invite-sales');

    // Clear form
    document.getElementById('invite-email').value = '';
    document.getElementById('invite-password').value = '';
    document.getElementById('invite-firstname').value = '';
    document.getElementById('invite-lastname').value = '';
    document.getElementById('invite-company').value = '';

    // Refresh user list
    loadUsers();
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sales-User anlegen';
  }
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

init();
