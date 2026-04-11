// Extracted from sales.js — Tasks, Availability, Commissions
// Depends on: sales.js (globals: window.currentProfile, window.allLeads, window.allTasks, clanaDB, clanaUtils, Components, CONFIG)
// ==========================================

// Window exports for cross-file access
window.loadTasks = loadTasks;
window.renderTasks = renderTasks;
window.updateTaskStats = updateTaskStats;
window.toggleTask = toggleTask;
window.saveTask = saveTask;
window.loadAvailability = loadAvailability;
window.saveAvailability = saveAvailability;
window.loadCommissions = loadCommissions;

// ==========================================
// TASKS
// ==========================================
async function loadTasks() {
  const result = await clanaDB.getTasks({ assigned_to: window.currentProfile.id });
  if (!result.success) return;
  window.allTasks = result.data || [];
  renderTasks();
  updateTaskStats();
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  if (!window.allTasks.length) {
    list.innerHTML = '<div class="empty-state"><h3>Keine Aufgaben</h3><p>Erstelle deine erste Aufgabe.</p></div>';
    return;
  }

  list.innerHTML = window.allTasks.map(t => {
    const isDone = t.status === 'done';
    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !isDone;
    const priorityColors = { low: 'badge-green', medium: 'badge-cyan', high: 'badge-orange', urgent: 'badge-red' };

    return `
      <div class="task-row">
        <div class="task-checkbox ${isDone ? 'done' : ''}" data-action="toggle-task" data-id="${clanaUtils.sanitizeAttr(t.id)}" data-extra="${clanaUtils.sanitizeAttr(t.status)}"
          ${isDone ? '<svg width="12" height="12" fill="white" stroke="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" fill="none"/></svg>' : ''}
        </div>
        <div class="task-title ${isDone ? 'done' : ''}">${clanaUtils.sanitizeHtml(t.title)}
          ${t.leads?.company_name ? `<span style="font-size:11px;color:var(--tx3);margin-left:8px;">${clanaUtils.sanitizeHtml(t.leads.company_name)}</span>` : ''}
        </div>
        <span class="task-priority ${priorityColors[t.priority] || 'badge-cyan'}" style="padding:2px 8px;border-radius:10px;font-size:10px;">${t.priority}</span>
        ${t.due_date ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">${new Date(t.due_date).toLocaleDateString('de-DE')}</span>` : ''}
      </div>
    `;
  }).join('');
}

function updateTaskStats() {
  document.getElementById('stat-tasks-open').textContent = window.allTasks.filter(t => t.status === 'open').length;
  document.getElementById('stat-tasks-progress').textContent = window.allTasks.filter(t => t.status === 'in_progress').length;
  document.getElementById('stat-tasks-done').textContent = window.allTasks.filter(t => t.status === 'done').length;
}

async function toggleTask(id, currentStatus) {
  const newStatus = currentStatus === 'done' ? 'open' : 'done';
  const result = await clanaDB.updateTask(id, { status: newStatus });
  if (result.success) loadTasks();
}

async function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) { Components.toast('Titel ist erforderlich', 'error'); return; }

  const result = await clanaDB.createTask({
    title: title,
    description: document.getElementById('task-desc').value.trim(),
    due_date: document.getElementById('task-due').value || null,
    priority: document.getElementById('task-priority').value,
    assigned_to: window.currentProfile.id,
    lead_id: document.getElementById('task-lead').value || null
  });

  if (result.success) {
    Components.toast('Aufgabe erstellt', 'success');
    closeModal('modal-add-task');
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    loadTasks();
  } else {
    Components.toast('Fehler: ' + result.error, 'error');
  }
}

// ==========================================
// AVAILABILITY
// ==========================================
async function loadAvailability() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);

  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  const start = days[0].toISOString().split('T')[0];
  const end = days[days.length - 1].toISOString().split('T')[0];
  const result = await clanaDB.getAvailability(window.currentProfile.id, start, end);
  const availData = result.success ? result.data : [];

  const grid = document.getElementById('avail-grid');
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  grid.innerHTML = days.map(d => {
    const dateStr = d.toISOString().split('T')[0];
    const entry = availData.find(a => a.date === dateStr);
    const isToday = dateStr === today.toISOString().split('T')[0];

    return `
      <div class="avail-day" style="${isToday ? 'border-color:var(--pu);' : ''}" data-action="set-avail" data-id="${clanaUtils.sanitizeAttr(dateStr)}">
        <div class="avail-day-label">${dayNames[d.getDay()]}</div>
        <div class="avail-day-num" style="${isToday ? 'color:var(--pu3);' : ''}">${d.getDate()}</div>
        ${entry ? `<div class="avail-dot ${entry.type}"></div>` : ''}
      </div>
    `;
  }).join('');
}

function setAvailForDate(dateStr) {
  document.getElementById('avail-date').value = dateStr;
  openModal('modal-avail');
}

async function saveAvailability() {
  const date = document.getElementById('avail-date').value;
  if (!date) { Components.toast('Datum ist erforderlich', 'error'); return; }

  const result = await clanaDB.setAvailability({
    date: date,
    start_time: document.getElementById('avail-start').value,
    end_time: document.getElementById('avail-end').value,
    type: document.getElementById('avail-type').value,
    note: document.getElementById('avail-note').value.trim()
  });

  if (result.success) {
    Components.toast('Verfügbarkeit gespeichert', 'success');
    closeModal('modal-avail');
    loadAvailability();
  } else {
    Components.toast('Fehler: ' + result.error, 'error');
  }
}

// ==========================================
// COMMISSIONS
// ==========================================
const PLAN_PRICES = CONFIG.PLANS;
const COMMISSION_RATE = CONFIG.COMMISSION_RATE;

async function loadCommissions() {
  const tbody = document.getElementById('comm-tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--tx3);padding:40px;">Laden...</td></tr>';

  const wonLeads = window.allLeads.filter(l => l.status === 'won');

  // Batch-load customer profiles for all won leads in a single query
  const wonEmails = wonLeads.map(l => l.email).filter(Boolean);
  let profileMap = {};
  if (wonEmails.length > 0) {
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('*, organizations(name, plan)')
      .eq('role', 'customer')
      .in('email', wonEmails);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map(p => [p.email, p]));
    }
  }

  let customers = [];
  for (const lead of wonLeads) {
    if (lead.email) {
      const profile = profileMap[lead.email];
      if (profile) {
        customers.push({ ...profile, lead });
      } else {
        customers.push({
          email: lead.email,
          first_name: lead.contact_name?.split(' ')[0] || lead.company_name,
          last_name: lead.contact_name?.split(' ').slice(1).join(' ') || '',
          company: lead.company_name,
          organizations: { name: lead.company_name, plan: guessPlanFromValue(lead.value) },
          is_active: true,
          created_at: lead.created_at,
          lead
        });
      }
    }
  }

  // Calculate commissions
  let totalRevenue = 0;
  let totalCommission = 0;
  let activeCount = 0;

  const rows = customers.map(c => {
    const plan = c.organizations?.plan || 'starter';
    const planKey = plan.toLowerCase();
    const monthlyNetto = CONFIG.getPlanPrice(planKey) || estimateFromLeadValue(c.lead?.value);
    const commission = Math.round(monthlyNetto * COMMISSION_RATE * 100) / 100;
    const isActive = c.is_active !== false;

    if (isActive) {
      totalRevenue += monthlyNetto;
      totalCommission += commission;
      activeCount++;
    }

    const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || '—';
    const planLabel = CONFIG.getPlanLabel(planKey);

    return `
      <tr>
        <td><strong>${clanaUtils.sanitizeHtml(name)}</strong><br><span style="font-size:11px;color:var(--tx3);">${clanaUtils.sanitizeHtml(c.company || c.organizations?.name || '')}</span></td>
        <td><span class="badge badge-purple">${planLabel}</span></td>
        <td>${monthlyNetto.toLocaleString('de-DE')} €</td>
        <td style="color:var(--green);font-weight:700;">${commission.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
        <td><span class="badge ${isActive ? 'badge-green' : 'badge-red'}">${isActive ? 'Aktiv' : 'Inaktiv'}</span></td>
        <td>${clanaUtils.formatDate(c.created_at)}</td>
      </tr>
    `;
  });

  // Update stats
  document.getElementById('comm-monthly').textContent = totalCommission.toLocaleString('de-DE', {minimumFractionDigits: 2}) + ' €';
  document.getElementById('comm-customers').textContent = activeCount;
  document.getElementById('comm-revenue').textContent = totalRevenue.toLocaleString('de-DE') + ' €';

  const now = new Date();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  let lastMonthCommission = 0;
  customers.forEach(c => {
    if (c.is_active !== false && new Date(c.created_at) <= lastMonthEnd) {
      const plan = c.organizations?.plan || 'starter';
      lastMonthCommission += CONFIG.getPlanPrice(plan.toLowerCase()) * COMMISSION_RATE;
    }
  });
  document.getElementById('comm-last-month').textContent = lastMonthCommission.toLocaleString('de-DE', {minimumFractionDigits: 2}) + ' €';

  if (rows.length) {
    tbody.innerHTML = rows.join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--tx3);padding:40px;">Noch keine gewonnenen Kunden. Gewinne Leads um Provisionen zu verdienen!</td></tr>';
  }
}

function guessPlanFromValue(value) {
  if (!value) return 'starter';
  if (value >= 500) return 'business';
  if (value >= 250) return 'professional';
  return 'starter';
}

function estimateFromLeadValue(value) {
  if (!value) return CONFIG.getPlanPrice('starter');
  if (value >= 500) return CONFIG.getPlanPrice('business');
  if (value >= 250) return CONFIG.getPlanPrice('professional');
  return CONFIG.getPlanPrice('starter');
}
