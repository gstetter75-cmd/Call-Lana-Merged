// ==========================================
// GLOBALS
// ==========================================
let currentUser = null;
let currentProfile = null;
let userSettings = {};

// Register safe event delegation actions
if (typeof SafeActions !== 'undefined') {
  SafeActions.registerAll({
    'open-conn': (id) => openConnModal(id),
    'save-profile': () => saveProfile(),
    'save-billing': () => saveBillingAddress(),
    'change-pw': () => changePassword(),
    'save-notifs': () => saveNotifications(),
    'toggle-notif': (_, __, el) => toggleNotif(el),
    'close-conn': () => closeConnModal(),
    'conn-oauth': () => connStartOAuth(),
    'conn-save-api': () => connSaveApiKey(),
    'conn-copy-webhook': () => connCopyWebhook(),
    'conn-toggle-secret': () => connToggleSecret(),
    'conn-activate-webhook': () => connActivateWebhook(),
    'conn-save-sip': () => connSaveSip(),
    'conn-copy-forward': () => connCopyForward(),
    'conn-activate-forward': () => connActivateForward(),
    'conn-notify-ready': () => connNotifyReady(),
    'conn-disconnect': () => connDisconnect(),
    'save-emergency': () => { if (typeof SettingsExtra !== 'undefined') SettingsExtra.saveEmergency(); },
    'connect-calendar': () => { if (typeof SettingsExtra !== 'undefined') SettingsExtra.connectCalendar(); },
    'save-calendar': () => { if (typeof SettingsExtra !== 'undefined') SettingsExtra.saveCalendar(); },
    'add-forward-rule': () => { if (typeof SettingsExtra !== 'undefined') SettingsExtra.addForwardingRule(); },
    'save-addons': () => { if (typeof SettingsExtra !== 'undefined') SettingsExtra.saveAddons(); },
    'delete-account': () => deleteAccount(),
  });
}

// ==========================================
// AUTH CHECK (role-based via AuthGuard)
// ==========================================
(async () => {
  currentProfile = await AuthGuard.init();
  if (!currentProfile) return;

  currentUser = await clanaAuth.getUser();

  // Load shared sidebar
  await Components.loadSidebar('sidebar-container', currentProfile);

  // Logout handler
  document.getElementById('sidebar-logout')?.addEventListener('click', async () => {
    await clanaAuth.signOut();
    window.location.href = 'login.html';
  });

  // Profile form — use profiles table data first, fall back to auth metadata
  document.getElementById('firstName').value = currentProfile.first_name || '';
  document.getElementById('lastName').value = currentProfile.last_name || '';
  document.getElementById('email').value = currentProfile.email || currentUser?.email || '';
  document.getElementById('company').value = currentProfile.company || '';
  document.getElementById('industry').value = currentProfile.industry || '';

  // Last login
  const lastSign = currentUser?.last_sign_in_at;
  if (lastSign) {
    document.getElementById('lastLogin').textContent = new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(lastSign));
  }

  // Load notification settings from Supabase
  const settingsResult = await clanaDB.getSettings();
  if (settingsResult.success) {
    userSettings = settingsResult.data;
    applyNotificationToggles(userSettings);
  }

  // Load billing address fields from profiles table
  loadBillingAddress(currentProfile);
})();

// Window exports for cross-file access
window.saveProfile = saveProfile;
window.changePassword = changePassword;
window.saveBillingAddress = saveBillingAddress;
window.deleteAccount = deleteAccount;
window.saveNotifications = saveNotifications;
window.connDisconnect = connDisconnect;

// ==========================================
// SAVE PROFILE (Supabase)
// ==========================================
async function saveProfile() {
  const btn = document.getElementById('saveProfileBtn');
  const errEl = document.getElementById('profile-err');
  errEl.textContent = '';

  const fn = document.getElementById('firstName').value.trim();
  const ln = document.getElementById('lastName').value.trim();
  const co = document.getElementById('company').value.trim();
  const ind = document.getElementById('industry').value.trim();

  if (!fn || !ln) {
    errEl.textContent = 'Vor- und Nachname sind erforderlich.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Speichert...';

  // Update auth metadata
  const authResult = await clanaAuth.updateProfile({
    firstName: fn,
    lastName: ln,
    fullName: fn + ' ' + ln,
    company: co,
    industry: ind
  });

  // Update profiles table
  if (currentProfile?.id) {
    await clanaDB.updateProfile(currentProfile.id, {
      first_name: fn,
      last_name: ln,
      company: co,
      industry: ind
    });
  }

  btn.disabled = false;
  btn.textContent = 'Änderungen speichern';

  if (authResult.success) {
    // Update sidebar user info if present
    const nameEl = document.querySelector('.sb-user-name');
    const avatarEl = document.querySelector('.sb-avatar');
    if (nameEl) nameEl.textContent = fn + ' ' + ln;
    if (avatarEl) avatarEl.textContent = fn.charAt(0).toUpperCase();
    showToast('Profil erfolgreich aktualisiert!');
  } else {
    errEl.textContent = 'Fehler: ' + authResult.error;
  }
}

// ==========================================
// CHANGE PASSWORD (Supabase)
// ==========================================
async function changePassword() {
  if (typeof ImpersonationManager !== 'undefined' && ImpersonationManager.isActionBlocked('change_password')) {
    showToast('Passwort-Änderung ist während Impersonation nicht erlaubt.', true);
    return;
  }
  const btn = document.getElementById('savePwBtn');
  const errEl = document.getElementById('pw-err');
  errEl.textContent = '';

  const pw1 = document.getElementById('newPw').value;
  const pw2 = document.getElementById('newPw2').value;

  if (!pw1 || pw1.length < 8) {
    errEl.textContent = 'Passwort muss mindestens 8 Zeichen haben.';
    return;
  }
  if (pw1 !== pw2) {
    errEl.textContent = 'Passwörter stimmen nicht überein.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Speichert…';

  try {
    const { data, error } = await supabaseClient.auth.updateUser({ password: pw1 });
    if (error) throw error;
    document.getElementById('newPw').value = '';
    document.getElementById('newPw2').value = '';
    showToast('Passwort erfolgreich geändert!');
  } catch (e) {
    Logger.error('changePassword', e);
    errEl.textContent = 'Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.';
  }

  btn.disabled = false;
  btn.textContent = 'Passwort aktualisieren';
}

// ==========================================
// NOTIFICATIONS (Supabase)
// ==========================================
function toggleNotif(el) {
  el.classList.toggle('on');
}

function applyNotificationToggles(settings) {
  document.querySelectorAll('.toggle-switch[data-key]').forEach(toggle => {
    const key = toggle.dataset.key;
    if (settings[key] !== undefined) {
      toggle.classList.toggle('on', !!settings[key]);
    }
  });
}

async function saveNotifications() {
  const notifications = {};
  document.querySelectorAll('.toggle-switch[data-key]').forEach(toggle => {
    notifications[toggle.dataset.key] = toggle.classList.contains('on');
  });

  userSettings = { ...userSettings, ...notifications };
  const result = await clanaDB.saveSettings(userSettings);

  if (result.success) {
    showToast('Benachrichtigungen gespeichert!');
  } else {
    showToast('Fehler beim Speichern: ' + result.error, true);
  }
}

// ==========================================
// BILLING ADDRESS
// ==========================================

/**
 * Populate billing address fields from the profile record.
 * @param {Object} profile - Profile record from Supabase
 */
function loadBillingAddress(profile) {
  if (!profile) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  };
  setVal('billingCompany', profile.billing_company);
  setVal('billingStreet', profile.billing_street);
  setVal('billingZip', profile.billing_zip);
  setVal('billingCity', profile.billing_city);
  setVal('billingCountry', profile.billing_country);
  setVal('billingVatId', profile.billing_vat_id);

  // Auto-invoice email toggle
  const toggle = document.getElementById('autoInvoiceEmail');
  if (toggle && userSettings.auto_invoice_email) {
    toggle.classList.add('on');
  }
}

/**
 * Save billing address fields to the profiles table and auto_invoice_email to settings.
 */
async function saveBillingAddress() {
  const errEl = document.getElementById('billing-addr-err');
  if (errEl) errEl.textContent = '';

  const billingCompany = (document.getElementById('billingCompany')?.value || '').trim();
  const billingStreet = (document.getElementById('billingStreet')?.value || '').trim();
  const billingZip = (document.getElementById('billingZip')?.value || '').trim();
  const billingCity = (document.getElementById('billingCity')?.value || '').trim();
  const billingCountry = (document.getElementById('billingCountry')?.value || '').trim();
  const billingVatId = (document.getElementById('billingVatId')?.value || '').trim();

  if (!billingCompany || !billingStreet || !billingZip || !billingCity) {
    if (errEl) errEl.textContent = 'Bitte Firma, Stra\u00DFe, PLZ und Ort ausfuellen.';
    return;
  }

  try {
    // Save billing address to profiles table
    if (currentProfile?.id) {
      await clanaDB.updateProfile(currentProfile.id, {
        billing_company: billingCompany,
        billing_street: billingStreet,
        billing_zip: billingZip,
        billing_city: billingCity,
        billing_country: billingCountry || 'Deutschland',
        billing_vat_id: billingVatId || null
      });
    }

    // Save auto-invoice email preference to settings
    const autoEmailToggle = document.getElementById('autoInvoiceEmail');
    const autoInvoiceEmail = autoEmailToggle ? autoEmailToggle.classList.contains('on') : false;
    userSettings = { ...userSettings, auto_invoice_email: autoInvoiceEmail };
    await clanaDB.saveSettings(userSettings);

    showToast('Rechnungsadresse gespeichert!');
  } catch (err) {
    Logger.error('saveBillingAddress', err);
    if (errEl) errEl.textContent = 'Fehler beim Speichern. Bitte erneut versuchen.';
  }
}

// ==========================================
// DELETE ACCOUNT
// ==========================================
async function deleteAccount() {
  if (typeof ImpersonationManager !== 'undefined' && ImpersonationManager.isActionBlocked('delete_account')) {
    showToast('Account-Löschung ist während Impersonation nicht erlaubt.', true);
    return;
  }
  const confirmed = prompt('Gib "LÖSCHEN" ein, um dein Konto unwiderruflich zu löschen:');
  if (confirmed !== 'LÖSCHEN') return;

  showToast('Bitte kontaktiere den Support unter info@call-lana.de für die Kontolöschung.', true);
}

// showToast — now provided by js/modules/toast.js via core.js

// Connectors → extracted to js/settings-connectors.js


// ==========================================
// TAB NAVIGATION
// ==========================================
document.querySelectorAll('.sn-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const tab = item.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById('tab-' + tab).style.display = 'block';
    if (tab === 'connectors') initConnectorTab();
    if (typeof SettingsExtra !== 'undefined') SettingsExtra.initTab(tab);
    window.location.hash = tab;
  });
});

// Open tab from URL hash
(function() {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const tabEl = document.getElementById('tab-' + hash);
    if (tabEl) {
      document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
      const navItem = document.querySelector('.sn-item[data-tab="' + hash + '"]');
      if (navItem) navItem.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
      tabEl.style.display = 'block';
      if (hash === 'connectors') initConnectorTab();
      if (typeof SettingsExtra !== 'undefined') SettingsExtra.initTab(hash);
    }
  }
})();

// Logout is handled via sidebar-logout in init()

// ==========================================
// MOBILE SIDEBAR (hamburger extra, sidebar close handled by Components)
// ==========================================
document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.add('open');
  document.getElementById('sidebarOverlay')?.classList.add('open');
});
document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
});
