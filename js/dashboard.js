// ==========================================
// Dashboard Main — Customer Dashboard Orchestrator
// Language: German only (i18n applies to marketing pages, not dashboards)
// Split modules: dashboard-billing.js, dashboard-integrations.js, dashboard-payment.js
// ==========================================

// Register safe event delegation actions
if (typeof SafeActions !== 'undefined') {
  SafeActions.registerAll({
    'edit-assistant': (id) => editAssistant(id),
    'delete-assistant': (id, name) => deleteAssistant(id, name),
    'navigate': (id) => { if (typeof navigateToPage === 'function') navigateToPage(id); },
    'open-topup': () => { if (typeof openTopupModal === 'function') openTopupModal(); else navigateToPage('billing'); },
    'close-topup': () => closeTopupModal(),
    'confirm-topup': () => confirmTopup(),
    'select-topup': (_, __, el) => selectTopup(el),
    'open-payment': (id) => openPaymentModal(Number(id)),
    'close-payment': () => closePaymentModal(),
    'save-payment': () => savePaymentMethod(),
    'remove-payment': (id) => removePaymentMethod(Number(id)),
    'select-pm-type': (id) => selectPaymentType(id),
    'export-csv-calls': () => { if (typeof CallsPage !== 'undefined') CallsPage.exportCSV(); },
    'appt-view': (id) => { if (typeof AppointmentsPage !== 'undefined') AppointmentsPage.setView(id); },
    'appt-prev': () => { if (typeof AppointmentsPage !== 'undefined') AppointmentsPage.prevWeek(); },
    'appt-next': () => { if (typeof AppointmentsPage !== 'undefined') AppointmentsPage.nextWeek(); },
    'open-contact-import': () => { if (typeof openContactImport === 'function') openContactImport(); },
    'close-csv-import': () => closeCsvImportModal(),
    'import-csv': () => importCsvContacts(),
    'close-conv': () => closeNewConvModal(),
    'create-conv': () => createNewConversation(),
    'close-invite': () => closeInviteModal(),
    'send-invite': () => sendInvite(),
    'download-invoices': () => downloadSelectedInvoices(),
    'send-invoices': () => sendSelectedInvoices(),
    'assign-number': () => { navigateToPage('assistants'); showToast('Weise eine Telefonnummer im Assistenten-Editor zu.'); },
    'select-plan': (id) => { if (typeof selectPlan === 'function') selectPlan(id); },
    'csv-drop-click': () => document.getElementById('csvFileInput')?.click(),
    'toggle-sidebar': () => { document.querySelector('.sidebar')?.classList.toggle('open'); document.getElementById('sidebarOverlay')?.classList.toggle('open'); },
  });
}

// Null-safe DOM helpers (prevent TypeError when elements don't exist yet)
function $id(id) { return document.getElementById(id); }
function $setText(id, text) { const el = $id(id); if (el) el.textContent = text; }
function $setVal(id, val) { const el = $id(id); if (el) el.value = val; }
function $setHtml(id, html) { const el = $id(id); if (el) el.innerHTML = html; }
function $setAttr(id, attr, val) { const el = $id(id); if (el) el.setAttribute(attr, val); }

// Window exports for cross-file access
window.showToast = showToast;
window.navigateToPage = navigateToPage;
window.escHtml = escHtml;
window.formatCurrency = formatCurrency;
window.formatMinutes = formatMinutes;
window.loadBilling = loadBilling;
window.loadPlan = loadPlan;
window.$id = $id;
window.$setText = $setText;
window.$setVal = $setVal;
window.$setHtml = $setHtml;
window.$setAttr = $setAttr;

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

  // Check trial status
  try {
    const { data: trialStatus } = await supabaseClient.rpc('check_trial_status', {
      p_user_id: currentUser.id
    });
    window.__trialStatus = trialStatus;

    // Render trial banner
    const trialBanner = document.getElementById('trial-banner');
    if (trialBanner && trialStatus) {
      if (trialStatus.status === 'trial_active') {
        const days = trialStatus.days_remaining;
        const credit = (trialStatus.credit_remaining_cents / 100).toFixed(2);
        const urgentClass = days <= 5 || trialStatus.credit_remaining_cents <= 500 ? '#f59e0b' : '#7c3aed';
        trialBanner.innerHTML = `<div style="background:${urgentClass}22;border:1px solid ${urgentClass}44;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="font-size:20px;">🎁</span>
          <div style="flex:1;"><strong style="color:${urgentClass};font-size:13px;">Testphase aktiv</strong><br><span style="font-size:12px;color:var(--tx3);">Noch ${days} Tage und ${credit} € Guthaben verbleibend.</span></div>
          <button class="btn btn-sm" data-action="navigate" data-id="plans" style="white-space:nowrap;">Plan wählen</button>
        </div>`;
      } else if (trialStatus.status === 'trial_expired') {
        // Blocking overlay
        const overlay = document.createElement('div');
        overlay.id = 'trial-expired-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(6,6,15,.92);display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `<div style="background:var(--bg2);border-radius:20px;padding:40px;max-width:500px;text-align:center;border:1px solid var(--border);">
          <div style="font-size:48px;margin-bottom:16px;">⏰</div>
          <h2 style="font-size:20px;margin-bottom:8px;">Testphase beendet</h2>
          <p style="color:var(--tx3);font-size:14px;margin-bottom:24px;">${trialStatus.reason === 'credit_exhausted' ? 'Dein Testguthaben ist aufgebraucht.' : 'Die 30-Tage-Testphase ist abgelaufen.'} Wähle jetzt einen Plan, um Call Lana weiter zu nutzen.</p>
          <button class="btn btn-primary" data-action="navigate" data-id="plans" style="font-size:16px;padding:14px 32px;">Plan auswählen</button>
        </div>`;
        document.body.appendChild(overlay);
      }
    }
  } catch (e) {
    // RPC failed — fallback: read subscription directly
    try {
      const effectiveId = await auth.getEffectiveUserId();
      const { data: sub } = await supabaseClient
        .from('subscriptions')
        .select('trial_active, trial_ends_at, balance_cents, plan, service_active, paused_reason')
        .eq('user_id', effectiveId)
        .single();

      if (sub?.trial_active) {
        const daysLeft = Math.max(0, Math.floor((new Date(sub.trial_ends_at) - Date.now()) / 86400000));
        if (daysLeft <= 0 || sub.balance_cents <= 0) {
          window.__trialStatus = { status: 'trial_expired', reason: sub.balance_cents <= 0 ? 'credit_exhausted' : 'time_expired' };
        } else {
          window.__trialStatus = { status: 'trial_active', days_remaining: daysLeft, credit_remaining_cents: sub.balance_cents };
        }
      } else if (sub?.paused_reason === 'trial_expired') {
        window.__trialStatus = { status: 'trial_expired', reason: 'time_expired' };
      } else {
        window.__trialStatus = { status: sub?.plan || 'none', service_active: sub?.service_active };
      }

      // Render overlay for expired trials (same as above)
      if (window.__trialStatus?.status === 'trial_expired') {
        const overlay = document.createElement('div');
        overlay.id = 'trial-expired-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(6,6,15,.92);display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `<div style="background:var(--bg2);border-radius:20px;padding:40px;max-width:500px;text-align:center;border:1px solid var(--border);">
          <div style="font-size:48px;margin-bottom:16px;">⏰</div>
          <h2 style="font-size:20px;margin-bottom:8px;">Testphase beendet</h2>
          <p style="color:var(--tx3);font-size:14px;margin-bottom:24px;">Wähle jetzt einen Plan, um Call Lana weiter zu nutzen.</p>
          <button class="btn btn-primary" data-action="navigate" data-id="plans" style="font-size:16px;padding:14px 32px;">Plan auswählen</button>
        </div>`;
        document.body.appendChild(overlay);
      }
    } catch (fallbackErr) {
      window.__trialStatus = null;
    }
  }

  // Handle payment return from Stripe
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    if (typeof showToast === 'function') showToast('Zahlung erfolgreich! Daten werden aktualisiert.');
    // Force billing data reload on success
    setTimeout(() => { if (typeof loadBillingData === 'function') loadBillingData(); }, 500);
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
  } else if (urlParams.get('payment') === 'cancelled') {
    if (typeof showToast === 'function') showToast('Zahlung abgebrochen.', true);
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
  }

  // Load shared sidebar
  await Components.loadSidebar('sidebar-container', currentProfile);

  // Logout handler
  document.getElementById('sidebar-logout')?.addEventListener('click', async () => {
    await clanaAuth.signOut();
    window.location.href = 'login.html';
  });

  initMonthSelect();

  // Load only essential data upfront, rest is lazy-loaded on navigation
  await Promise.all([
    loadHomeData(),
    loadAssistants()
  ]);

  // Onboarding checklist
  if (typeof Onboarding !== 'undefined') Onboarding.init(currentUser?.id);

  // Notification center
  if (typeof NotificationCenter !== 'undefined') NotificationCenter.init(currentProfile);

  // Help tooltips + activity log
  if (typeof DashboardExtras !== 'undefined') {
    DashboardExtras.initHelpTooltips();
    DashboardExtras.loadRecentActions();
  }

  // Analytics: usage alerts, assistant performance, call heatmap
  if (typeof DashboardAnalytics !== 'undefined') {
    DashboardAnalytics.checkUsageAlerts();
    DashboardAnalytics.loadAssistantPerformance();
    DashboardAnalytics.loadCallHeatmap();
  }

  // Home widgets: metric cards, emergency banner, recent calls, appointments, top leads
  if (typeof HomeWidgets !== 'undefined') {
    HomeWidgets.init();
  }

  // Realtime subscriptions for live updates
  if (typeof RealtimeManager !== 'undefined') {
    RealtimeManager.init();
  }

  // Team management
  document.getElementById('btnInviteMember')?.addEventListener('click', inviteTeamMember);
  document.getElementById('btnNewConversation')?.addEventListener('click', startNewConversation);
  document.getElementById('btnSendMessage')?.addEventListener('click', sendMessage);
  document.getElementById('messageInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
})();

// ==========================================
// Assistants → extracted to js/dashboard-assistants.js
// Calls → extracted to js/dashboard-calls.js

// ==========================================
// BILLING
// ==========================================
async function loadBilling() {
  const settingsResult = await clanaDB.getSettings();
  const settings = settingsResult.success ? settingsResult.data : {};
  const balance = settings.balance || 0;

  $setText('balanceValue', formatCurrency(balance));
  $setText('balanceSub', balance > 0 ? 'Verfügbar' : 'Kein Guthaben vorhanden');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = now.toISOString();
  const statsResult = await clanaDB.getStats(monthStart, monthEnd);

  if (statsResult.success) {
    const s = statsResult.stats;
    $setText('usageCalls', s.totalCalls.toLocaleString('de-DE'));
    $setText('usageMinutes', Math.round(s.totalDuration / 60).toLocaleString('de-DE'));
    const cost = (s.totalDuration / 60) * 0.15;
    $setText('usageCost', formatCurrency(cost));
  } else {
    $setText('usageCalls', '0');
    $setText('usageMinutes', '0');
    $setText('usageCost', '0,00 €');
  }
}

// ==========================================
// PLAN
// ==========================================
async function loadPlan() {
  // Read plan from subscriptions table (source of truth) instead of user_metadata
  let plan = 'trial';
  try {
    const effectiveId = await auth.getEffectiveUserId();
    const { data: sub } = await supabaseClient
      .from('subscriptions').select('plan, trial_active').eq('user_id', effectiveId).single();
    if (sub) {
      plan = sub.trial_active ? 'trial' : (sub.plan || 'trial');
    }
  } catch (e) {
    // Fallback to user_metadata
    plan = currentUser?.user_metadata?.plan || 'trial';
  }

  const labels = {
    trial: 'Testphase',
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    business: 'Business',
  };
  const descs = {
    trial: '30-Tage-Testphase mit 25 € Guthaben.',
    free: 'Kostenloser Plan.',
    starter: '340 Inklusivminuten pro Monat.',
    professional: '560 Inklusivminuten pro Monat.',
    business: 'Individuelles Paket.',
  };

  $setText('planBadge', labels[plan] || plan);
  $setText('planName', labels[plan] || plan);
  $setText('planDesc', descs[plan] || '');

  // Highlight current plan card and disable its button
  document.querySelectorAll('.plans-grid .card').forEach(card => {
    card.style.borderColor = '';
  });
  const cardId = 'planCard' + plan.charAt(0).toUpperCase() + plan.slice(1);
  const currentCard = document.getElementById(cardId);
  if (currentCard) {
    currentCard.style.borderColor = 'var(--green)';
    const btn = currentCard.querySelector('[data-action="select-plan"]');
    if (btn) {
      btn.textContent = 'Aktueller Plan';
      btn.disabled = true;
      btn.style.opacity = '0.5';
    }
  }
}

// ==========================================
// KNOWLEDGE BASE (placeholder)
// ==========================================
document.getElementById('btnUploadDoc')?.addEventListener('click', () => {
  showToast('Dokument-Upload: Kontaktiere den Support unter info@call-lana.de.');
});

document.getElementById('kbSearch')?.addEventListener('input', (e) => {
  // Placeholder search - no documents yet
});

// ==========================================
// HELPERS
// ==========================================
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

function escHtml(str) {
  return clanaUtils.sanitizeHtml(str);
}

function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => t.className = 'toast', 3000);
}

// ==========================================
// NAVIGATION

const breadcrumbNames = {
  home: 'Home',
  assistants: 'Assistenten',
  'assistant-edit': 'Assistent bearbeiten',
  knowledge: 'Wissensdatenbank',
  phones: 'Telefonnummern',
  transactions: 'Anrufverlauf',
  appointments: 'Termine',
  analytics: 'Analytics',
  billing: 'Guthaben',
  payment: 'Zahlungsmethoden',
  plans: 'Paket',
  team: 'Team',
  messages: 'Nachrichten',
  integrations: 'Integrationen'
};

// Valid dashboard pages whitelist
const VALID_PAGES = Object.keys(breadcrumbNames);

function navigateToPage(page, updateHash = true) {
  // Validate page against whitelist — fallback to 'home' for unknown routes
  if (!VALID_PAGES.includes(page) && page !== 'assistant-edit') {
    page = 'home';
  }
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');

  document.querySelectorAll('.sb-item').forEach(item => item.classList.remove('active'));
  document.querySelector('[data-page="' + page + '"]')?.classList.add('active');

  document.getElementById('breadcrumb').textContent = breadcrumbNames[page] || page;
  if (updateHash) window.location.hash = page;

  // Close sidebar on mobile
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');

  // Reset editor tabs on enter
  if (page === 'assistant-edit') {
    document.querySelectorAll('.editor-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.editor-panel').forEach((p, i) => p.classList.toggle('active', i === 0));
  }
}

// Sidebar click handlers — use event delegation since sidebar is loaded async
document.addEventListener('click', (e) => {
  const item = e.target.closest('.sb-item[data-page]');
  if (item) {
    e.preventDefault();
    navigateToPage(item.dataset.page);
  }
});

window.addEventListener('hashchange', () => {
  const page = window.location.hash.slice(1) || 'home';
  navigateToPage(page, false);
});

const initialPage = window.location.hash.slice(1) || 'home';
if (initialPage !== 'home') navigateToPage(initialPage, false);

// ==========================================
// MOBILE SIDEBAR (handled by Components.loadSidebar, hamburger is extra)
// ==========================================
document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.add('open');
  document.getElementById('sidebarOverlay')?.classList.add('open');
});
document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
});

// Logout is handled via sidebar-logout in init()

// Billing & Balance → extracted to js/dashboard-billing.js
// Integrations & CSV Import → extracted to js/dashboard-integrations.js
// Payment Methods → extracted to js/dashboard-payment.js

// ==========================================
// LAZY LOADING (navigation-triggered data loading)

// Load data when navigating to billing/payment pages
// Lazy loading: load data only when page is visited
const _loadedPages = new Set(['home']);
const origNavigate = navigateToPage;
navigateToPage = function(page, updateHash) {
  origNavigate(page, updateHash);
  // Sync mobile bottom nav active state
  document.querySelectorAll('.mob-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  if (_loadedPages.has(page)) return;
  _loadedPages.add(page);
  switch (page) {
    case 'transactions':
      loadAllCalls();
      if (typeof DashboardExtras !== 'undefined') DashboardExtras.renderTranscriptSearch(document.getElementById('transcript-search-section'));
      break;
    case 'appointments': if (typeof AppointmentsPage !== 'undefined') AppointmentsPage.init(); break;
    case 'analytics': if (typeof AnalyticsPage !== 'undefined') AnalyticsPage.init(); break;
    case 'billing': loadBilling(); loadBillingData(); break;
    case 'plan': loadPlan(); break;
    case 'team': loadTeam(); break;
    case 'messages': loadConversations(); break;
    case 'payment': loadPaymentMethods(); break;
    case 'integrations': loadIntegrations(); break;
    case 'invoices': loadInvoices(); break;
  }
};
// Also load on initial hash
if (window.location.hash === '#payment') loadPaymentMethods();
if (window.location.hash === '#billing') loadBillingData();
if (window.location.hash === '#integrations') loadIntegrations();

// Event delegation for data-action handlers
document.addEventListener('click', function(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'edit-assistant') editAssistant(el.dataset.id);
  else if (action === 'create-assistant') createNewAssistant();
  else if (action === 'show-call') { e.stopPropagation(); showCallDetail(Number(el.dataset.index)); }
  else if (action === 'close-overlay') el.closest('div[style*="fixed"]')?.remove();
});
