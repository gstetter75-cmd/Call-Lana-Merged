// Extracted from admin.js — loadSystemStats, loadOverview, renderMrrChart
// Depends on: admin.js (globals: clanaDB, clanaUtils, CONFIG, AdminOverview, AdminAudit)
// ==========================================

const PLAN_PRICES = CONFIG.PLANS;

// ==========================================
// SYSTEM STATS (KPIs, roles, plans, activity)
// ==========================================
async function loadSystemStats() {
  const [users, orgs, leads, tasks] = await Promise.all([
    clanaDB.getAllProfiles(),
    clanaDB.getOrganizations(),
    clanaDB.getLeads(),
    clanaDB.getTasks()
  ]);

  const allUsers = users.data || [];
  const allOrgs = orgs.data || [];
  const allLeads = leads.data || [];
  const allTasks = tasks.data || [];

  // Primary KPIs
  document.getElementById('sys-total-users').textContent = allUsers.length;
  document.getElementById('sys-total-orgs').textContent = allOrgs.length;

  // Secondary KPIs
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const newLeads = allLeads.filter(l => l.created_at >= sevenDaysAgo);
  const activeLeads = allLeads.filter(l => !['won', 'lost'].includes(l.status));
  const openTasks = allTasks.filter(t => t.status !== 'done');
  const wonLeads = allLeads.filter(l => l.status === 'won');
  const conversionRate = allLeads.length ? Math.round((wonLeads.length / allLeads.length) * 100) : 0;

  document.getElementById('sys-new-leads').textContent = newLeads.length;
  document.getElementById('sys-active-leads').textContent = activeLeads.length;
  document.getElementById('sys-open-tasks').textContent = openTasks.length;
  document.getElementById('sys-conversion').textContent = conversionRate + '%';

  // Role distribution
  const roles = { superadmin: 0, sales: 0, customer: 0 };
  allUsers.forEach(u => { if (roles[u.role] !== undefined) roles[u.role]++; });
  document.getElementById('sys-role-superadmin').textContent = roles.superadmin;
  document.getElementById('sys-role-sales').textContent = roles.sales;
  document.getElementById('sys-role-customer').textContent = roles.customer;

  // Plan distribution
  const plans = { solo: 0, team: 0, business: 0 };
  allOrgs.forEach(o => {
    const p = (o.plan || '').toLowerCase();
    if (p === 'starter' || p === 'solo') plans.solo++;
    else if (p === 'professional' || p === 'team') plans.team++;
    else if (p === 'business') plans.business++;
  });
  document.getElementById('sys-plan-solo').textContent = plans.solo;
  document.getElementById('sys-plan-team').textContent = plans.team;
  document.getElementById('sys-plan-business').textContent = plans.business;

  // Assistants count
  try {
    const assistantsResult = await clanaDB.getAllAssistants();
    document.getElementById('sys-total-assistants').textContent = assistantsResult.data?.length || 0;
  } catch (e) {
    document.getElementById('sys-total-assistants').textContent = '-';
  }

  // Recent activity
  const recentItems = [
    ...newLeads.slice(0, 5).map(l => ({
      time: l.created_at,
      user: l.profiles ? `${l.profiles.first_name || ''} ${l.profiles.last_name || ''}` : '—',
      action: 'Neuer Lead',
      details: clanaUtils.sanitizeHtml(l.company_name)
    })),
    ...allTasks.filter(t => t.created_at >= sevenDaysAgo).slice(0, 5).map(t => ({
      time: t.created_at,
      user: t.profiles ? `${t.profiles.first_name || ''} ${t.profiles.last_name || ''}` : '—',
      action: 'Neue Aufgabe',
      details: clanaUtils.sanitizeHtml(t.title)
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

  const tbody = document.getElementById('sys-activity-tbody');
  if (recentItems.length) {
    tbody.innerHTML = recentItems.map(item => `
      <tr>
        <td>${clanaUtils.formatDate(item.time)}</td>
        <td>${item.user}</td>
        <td><span class="badge badge-purple">${item.action}</span></td>
        <td>${item.details}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--tx3);padding:20px;">Keine Aktivität in den letzten 7 Tagen</td></tr>';
  }
}

// ==========================================
// OVERVIEW (Vogelperspektive — MRR, customers, churn)
// ==========================================
async function loadOverview() {
  const [usersResult, orgsResult, leadsResult] = await Promise.all([
    clanaDB.getAllProfiles(),
    clanaDB.getOrganizations(),
    clanaDB.getLeads()
  ]);

  const allUsers = usersResult.data || [];
  const allOrgs = orgsResult.data || [];
  const allLeads = leadsResult.data || [];
  const customers = allUsers.filter(u => u.role === 'customer' && u.is_active !== false);

  // Calculate MRR
  let mrr = 0;
  const planCounts = { starter: 0, professional: 0, business: 0 };

  allOrgs.filter(o => o.is_active !== false).forEach(o => {
    const plan = (o.plan || 'solo').toLowerCase();
    const price = CONFIG.getPlanPrice(plan);
    mrr += price;
    const normalized = plan === 'solo' ? 'starter' : plan === 'team' ? 'professional' : plan;
    if (planCounts[normalized] !== undefined) planCounts[normalized]++;
  });

  if (mrr === 0 && customers.length > 0) {
    mrr = customers.length * PLAN_PRICES.starter;
    planCounts.starter = customers.length;
  }

  const arr = mrr * 12;
  const arpu = customers.length ? Math.round(mrr / customers.length) : 0;

  document.getElementById('ov-mrr').textContent = mrr.toLocaleString('de-DE') + ' €';
  document.getElementById('ov-active-customers').textContent = customers.length;
  document.getElementById('ov-arr').textContent = arr.toLocaleString('de-DE') + ' €';
  document.getElementById('ov-arpu').textContent = arpu.toLocaleString('de-DE') + ' €';

  // Plan breakdown
  const planBreakdown = document.getElementById('ov-plan-breakdown');
  const totalPlanCustomers = Object.values(planCounts).reduce((a, b) => a + b, 0) || 1;
  planBreakdown.innerHTML = [
    { label: 'Starter (149 €)', count: planCounts.starter, color: 'var(--cyan)', revenue: planCounts.starter * 149 },
    { label: 'Professional (299 €)', count: planCounts.professional, color: 'var(--pu3)', revenue: planCounts.professional * 299 },
    { label: 'Business (599 €)', count: planCounts.business, color: 'var(--green)', revenue: planCounts.business * 599 },
  ].map(p => `
    <div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
        <span style="color:var(--tx2);">${p.label}</span>
        <span style="font-weight:700;">${p.count} Kunden · ${p.revenue.toLocaleString('de-DE')} €/M</span>
      </div>
      <div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${Math.round((p.count / totalPlanCustomers) * 100)}%;background:${p.color};border-radius:3px;transition:width .3s;"></div>
      </div>
    </div>
  `).join('');

  // Top sales
  const salesUsers = allUsers.filter(u => u.role === 'sales');
  const topSalesEl = document.getElementById('ov-top-sales');
  if (salesUsers.length) {
    const salesWithLeads = salesUsers.map(s => {
      const wonLeads = allLeads.filter(l => l.assigned_to === s.id && l.status === 'won');
      const pipelineValue = allLeads.filter(l => l.assigned_to === s.id && !['won', 'lost'].includes(l.status))
        .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      return { ...s, wonCount: wonLeads.length, pipelineValue };
    }).sort((a, b) => b.wonCount - a.wonCount);

    topSalesEl.innerHTML = salesWithLeads.map((s, i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0;${i < salesWithLeads.length - 1 ? 'border-bottom:1px solid var(--border);' : ''}">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--pu),var(--pu3));display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:700;">${(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;">${clanaUtils.sanitizeHtml(s.first_name || '')} ${clanaUtils.sanitizeHtml(s.last_name || '')}</div>
          <div style="font-size:11px;color:var(--tx3);">${s.wonCount} gewonnen · ${s.pipelineValue.toLocaleString('de-DE')} € Pipeline</div>
        </div>
        <span class="badge badge-green">${s.wonCount} Deals</span>
      </div>
    `).join('');
  } else {
    topSalesEl.innerHTML = '<div style="text-align:center;color:var(--tx3);font-size:12px;padding:20px;">Keine Vertriebler vorhanden</div>';
  }

  // Recent customers
  const recentCustomers = customers
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  const recentTbody = document.getElementById('ov-recent-tbody');
  if (recentCustomers.length) {
    recentTbody.innerHTML = recentCustomers.map(c => {
      const plan = c.organizations?.plan || 'starter';
      const price = CONFIG.getPlanPrice(plan);
      const matchingLead = allLeads.find(l => l.email === c.email && l.status === 'won');
      const salesName = matchingLead?.profiles ? `${matchingLead.profiles.first_name || ''} ${matchingLead.profiles.last_name || ''}`.trim() : '—';

      return `
        <tr>
          <td><strong>${clanaUtils.sanitizeHtml(c.first_name || '')} ${clanaUtils.sanitizeHtml(c.last_name || '')}</strong></td>
          <td>${clanaUtils.sanitizeHtml(c.email || '')}</td>
          <td><span class="badge badge-purple">${plan}</span></td>
          <td>${price.toLocaleString('de-DE')} €</td>
          <td>${clanaUtils.sanitizeHtml(salesName)}</td>
          <td>${clanaUtils.formatDate(c.created_at)}</td>
          <td><button class="btn btn-sm btn-outline" data-action="view-customer" data-id="${clanaUtils.sanitizeAttr(c.id)}">Details</button></td>
        </tr>
      `;
    }).join('');
  } else {
    recentTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--tx3);padding:20px;">Noch keine Kunden</td></tr>';
  }

  // Churn Stats
  const activeCustomers = allUsers.filter(u => u.role === 'customer' && u.is_active !== false);
  const inactiveCustomers = allUsers.filter(u => u.role === 'customer' && u.is_active === false);
  const totalCustomers = activeCustomers.length + inactiveCustomers.length;
  const churnRate = totalCustomers > 0 ? Math.round((inactiveCustomers.length / totalCustomers) * 100) : 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newThisMonth = activeCustomers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length;

  const churnEl = document.getElementById('ov-churn-stats');
  churnEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="background:var(--bg2);border-radius:10px;padding:14px;">
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:4px;">Churn-Rate</div>
        <div style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800;color:${churnRate > 10 ? 'var(--red)' : churnRate > 5 ? 'var(--orange)' : 'var(--green)'};">${churnRate}%</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px;">
        <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:4px;">Neu (30 Tage)</div>
        <div style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800;color:var(--green);">+${newThisMonth}</div>
      </div>
    </div>
    ${inactiveCustomers.length > 0 ? `
    <div style="margin-top:8px;">
      <div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:6px;">Inaktive Kunden (${inactiveCustomers.length})</div>
      ${inactiveCustomers.slice(0, 5).map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;">
          <span style="color:var(--tx2);">${clanaUtils.sanitizeHtml((c.first_name || '') + ' ' + (c.last_name || ''))}</span>
          <button class="btn btn-sm btn-outline" style="font-size:10px;padding:2px 8px;" data-action="toggle-active" data-id="${clanaUtils.sanitizeAttr(c.id)}" data-extra="false">Aktivieren</button>
        </div>
      `).join('')}
    </div>` : '<div style="text-align:center;color:var(--green);font-size:12px;padding:12px;">Keine inaktiven Kunden</div>'}
  `;

  // MRR Chart
  renderMrrChart(allUsers, allOrgs);

  // Enhanced widgets
  if (typeof AdminOverview !== 'undefined') {
    AdminOverview.renderQuickActions(document.getElementById('admin-quick-actions'));
    AdminOverview.renderKpiComparison(mrr, customers, allUsers);
    AdminOverview.renderLeaderboard(document.getElementById('admin-leaderboard'), allUsers, allLeads);

    try {
      const callsRes = await clanaDB.getCalls(5000);
      AdminOverview.renderHealthOverview(document.getElementById('admin-health-overview'), customers, callsRes?.data || []);
    } catch (e) {
      AdminOverview.renderHealthOverview(document.getElementById('admin-health-overview'), customers, []);
    }

    let dbCustomers = [];
    try {
      const custRes = await clanaDB.getCustomers({});
      dbCustomers = custRes.data || [];
    } catch (e) {}
    AdminOverview.renderCustomerFunnel(document.getElementById('admin-journey-funnel'), allLeads, dbCustomers);
  }

  if (typeof AdminAudit !== 'undefined') {
    AdminAudit.renderGoals(document.getElementById('admin-goals'), mrr, customers.length);
    AdminAudit.renderAnnouncements(document.getElementById('admin-announcements'));
  }
}

// ==========================================
// MRR CHART (SVG sparkline)
// ==========================================
function renderMrrChart(allUsers, allOrgs) {
  const svg = document.getElementById('ov-mrr-chart');
  if (!svg) return;

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d);
  }
  const monthNames = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

  const customers = allUsers.filter(u => u.role === 'customer');
  const mrrPerMonth = months.map(m => {
    const endOfMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);
    const activeAtMonth = customers.filter(c => new Date(c.created_at) <= endOfMonth && c.is_active !== false);
    let mrr = 0;
    activeAtMonth.forEach(c => {
      const org = allOrgs.find(o => o.id === c.organization_id);
      mrr += CONFIG.getPlanPrice(org?.plan || 'starter');
    });
    if (mrr === 0 && activeAtMonth.length > 0) mrr = activeAtMonth.length * CONFIG.getPlanPrice('starter');
    return mrr;
  });

  const maxMrr = Math.max(...mrrPerMonth, 1);
  const w = 400, h = 120, padT = 15, padB = 22, padL = 40, padR = 10;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const points = mrrPerMonth.map((v, i) => ({
    x: padL + (i / Math.max(mrrPerMonth.length - 1, 1)) * chartW,
    y: padT + chartH - (v / maxMrr) * chartH
  }));

  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
  const areaD = pathD + ` L${points[points.length-1].x.toFixed(1)},${padT+chartH} L${points[0].x.toFixed(1)},${padT+chartH} Z`;

  let labels = months.map((m, i) => {
    const x = padL + (i / Math.max(months.length - 1, 1)) * chartW;
    return `<text x="${x.toFixed(1)}" y="${h - 4}" fill="var(--tx3)" font-size="9" text-anchor="middle" font-family="Manrope">${monthNames[m.getMonth()]}</text>`;
  }).join('');

  labels += `<text x="${padL - 4}" y="${padT + 4}" fill="var(--tx3)" font-size="8" text-anchor="end" font-family="Manrope">${(maxMrr/1000).toFixed(1)}k</text>`;
  labels += `<text x="${padL - 4}" y="${padT + chartH}" fill="var(--tx3)" font-size="8" text-anchor="end" font-family="Manrope">0</text>`;

  const dots = points.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="var(--green)" stroke="var(--card)" stroke-width="2"/>`).join('');

  svg.innerHTML = `
    <defs><linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--green)" stop-opacity="0.25"/><stop offset="100%" stop-color="var(--green)" stop-opacity="0.02"/></linearGradient></defs>
    <path d="${areaD}" fill="url(#mrrGrad)"/>
    <path d="${pathD}" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}${labels}
  `;

  const growthEl = document.getElementById('ov-mrr-growth');
  if (growthEl && mrrPerMonth.length >= 2) {
    const current = mrrPerMonth[mrrPerMonth.length - 1];
    const prev = mrrPerMonth[mrrPerMonth.length - 2];
    const growth = prev > 0 ? Math.round(((current - prev) / prev) * 100) : 0;
    const isUp = growth >= 0;
    growthEl.innerHTML = `<span style="font-size:12px;font-weight:700;color:${isUp ? '#10b981' : '#ef4444'};">${isUp ? '↑' : '↓'} ${Math.abs(growth)}% Wachstum</span> <span style="font-size:11px;color:var(--tx3);">vs. Vormonat</span>`;
  }
}
