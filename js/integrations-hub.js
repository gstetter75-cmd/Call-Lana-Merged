// ==========================================
// Integrations Hub: Stripe, Calendar Sync, Email, File Upload, Twilio
// Checks actual connection status from integrations table
// ==========================================

const IntegrationsHub = {

  // Helper: load connection status for a provider
  async _getConnection(provider) {
    try {
      const user = await clanaAuth.getUser();
      if (!user) return null;
      const { data } = await supabaseClient.from('integrations')
        .select('*').eq('user_id', user.id).eq('provider', provider).maybeSingle();
      return data;
    } catch { return null; }
  },

  // Helper: save connection
  async _saveConnection(provider, label, category, config) {
    try {
      const user = await clanaAuth.getUser();
      if (!user) throw new Error('Nicht eingeloggt');
      const { error } = await supabaseClient.from('integrations').upsert({
        user_id: user.id,
        provider,
        provider_label: label,
        category,
        status: 'connected',
        config,
        connected_at: new Date().toISOString()
      }, { onConflict: 'user_id,provider' });
      if (error) throw error;
      return true;
    } catch (err) {
      if (typeof Components !== 'undefined') Components.toast('Verbindung fehlgeschlagen: ' + (err.message || 'Fehler'), 'error');
      return false;
    }
  },

  // Helper: disconnect
  async _disconnect(provider) {
    try {
      const user = await clanaAuth.getUser();
      if (!user) return false;
      await supabaseClient.from('integrations').delete()
        .eq('user_id', user.id).eq('provider', provider);
      return true;
    } catch { return false; }
  },

  // ==========================================
  // STRIPE (Payment Processing)
  // ==========================================

  async renderStripeSettings(container) {
    if (!container) return;
    const conn = await this._getConnection('stripe');
    const isConnected = !!conn;

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="width:48px;height:48px;border-radius:12px;background:#635bff22;display:flex;align-items:center;justify-content:center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#635bff"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.18l-.897 5.555C5.014 22.77 7.97 24 11.326 24c2.588 0 4.737-.715 6.217-1.9 1.673-1.32 2.5-3.275 2.5-5.67 0-4.218-2.737-5.95-6.067-7.28z"/></svg>
        </div>
        <div>
          <h3 style="margin:0;font-size:16px;">Stripe</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--tx3);">Sichere Zahlungsabwicklung für Abonnements und Einmalzahlungen</p>
        </div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:16px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Status: <span style="color:${isConnected ? '#4ade80' : '#f59e0b'};">${isConnected ? 'Verbunden' : 'Nicht konfiguriert'}</span></div>
        ${isConnected ? `
          <p style="font-size:12px;color:var(--tx3);margin:0;">Verbunden seit ${conn.connected_at ? new Date(conn.connected_at).toLocaleDateString('de-DE') : '-'}</p>
          ${conn.config?.stripe_key_last4 ? `<p style="font-size:12px;color:var(--tx3);margin:4px 0 0;">API-Key: ...${clanaUtils.sanitizeHtml(conn.config.stripe_key_last4)}</p>` : ''}
        ` : `
          <p style="font-size:12px;color:var(--tx3);margin:0 0 12px;">Gib deinen Stripe Secret Key ein, um Zahlungen zu aktivieren.</p>
          <div style="margin-bottom:8px;">
            <label style="font-size:11px;font-weight:600;color:var(--tx3);display:block;margin-bottom:4px;">Stripe Secret Key</label>
            <input type="password" id="stripe-key-input" class="finp" placeholder="sk_live_... oder sk_test_..." style="font-family:monospace;font-size:12px;">
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;color:var(--tx3);display:block;margin-bottom:4px;">Webhook Secret (optional)</label>
            <input type="password" id="stripe-webhook-input" class="finp" placeholder="whsec_..." style="font-family:monospace;font-size:12px;">
          </div>
        `}
      </div>
      <div style="display:flex;gap:8px;">
        ${isConnected ? `
          <button class="btn btn-outline btn-sm" id="btn-stripe-disconnect">Trennen</button>
        ` : `
          <button class="btn btn-primary btn-sm" id="btn-stripe-connect">Stripe verbinden</button>
        `}
      </div>
    `;

    if (isConnected) {
      document.getElementById('btn-stripe-disconnect')?.addEventListener('click', async () => {
        if (!confirm('Stripe-Verbindung wirklich trennen?')) return;
        if (await this._disconnect('stripe')) {
          Components.toast('Stripe getrennt.', 'success');
          this.renderStripeSettings(container);
        }
      });
    } else {
      document.getElementById('btn-stripe-connect')?.addEventListener('click', async () => {
        const key = document.getElementById('stripe-key-input')?.value?.trim();
        const webhook = document.getElementById('stripe-webhook-input')?.value?.trim();
        if (!key || key.length < 20) {
          Components.toast('Bitte einen gültigen Stripe Key eingeben.', 'error');
          return;
        }
        // Encrypt key server-side
        let encRef = null;
        try {
          const { data } = await supabaseClient.functions.invoke('encrypt-secret', {
            body: { provider: 'stripe', secret: key }
          });
          encRef = data?.ref;
        } catch { /* fallback: store only metadata */ }

        const saved = await this._saveConnection('stripe', 'Stripe', 'Zahlungen', {
          type: 'apikey',
          stripe_key_last4: key.slice(-4),
          webhook_configured: !!webhook,
          encrypted_key_ref: encRef
        });
        if (saved) {
          Components.toast('Stripe erfolgreich verbunden!', 'success');
          this.renderStripeSettings(container);
        }
      });
    }
  },

  // ==========================================
  // CALENDAR SYNC (Google / Outlook / Apple)
  // ==========================================

  async renderCalendarSync(container) {
    if (!container) return;
    const providers = [
      { id: 'google_calendar', name: 'Google Calendar', icon: '📅', scopes: 'calendar.readonly, calendar.events', setup: 'Google Cloud Console → OAuth 2.0 Client ID', placeholder: 'OAuth Client ID oder API-Key' },
      { id: 'outlook_calendar', name: 'Microsoft Outlook', icon: '📆', scopes: 'Calendars.ReadWrite', setup: 'Azure Portal → App Registration', placeholder: 'Azure Client ID' },
      { id: 'apple_calendar', name: 'Apple Kalender', icon: '🍎', scopes: 'CalDAV', setup: 'App-spezifisches Passwort in iCloud', placeholder: 'App-spezifisches Passwort' }
    ];

    // Load connection status for all calendar providers
    const connections = {};
    for (const p of providers) {
      connections[p.id] = await this._getConnection(p.id);
    }

    container.innerHTML = `
      <h3 style="margin:0 0 16px;font-size:16px;">Kalender-Integration</h3>
      <p style="font-size:12px;color:var(--tx3);margin-bottom:16px;">Verbinde deinen persönlichen Kalender für automatische Verfügbarkeitssynchronisation.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">
        ${providers.map(p => {
          const conn = connections[p.id];
          const isConnected = !!conn;
          return `
          <div class="card" style="padding:16px;${isConnected ? 'border-color:rgba(74,222,128,.4);' : ''}">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <span style="font-size:24px;">${p.icon}</span>
              <div>
                <div style="font-weight:600;font-size:14px;">${p.name}</div>
                <div style="font-size:11px;color:var(--tx3);">${p.scopes}</div>
              </div>
            </div>
            ${isConnected ? `
              <div style="background:rgba(74,222,128,.1);border-radius:8px;padding:10px;font-size:11px;color:#4ade80;margin-bottom:12px;font-weight:600;">
                Verbunden seit ${conn.connected_at ? new Date(conn.connected_at).toLocaleDateString('de-DE') : '-'}
              </div>
              <button class="btn btn-outline btn-sm btn-cal-disconnect" data-provider="${p.id}" style="width:100%;color:#ef4444;border-color:#ef444444;">Trennen</button>
            ` : `
              <div style="background:var(--bg3);border-radius:8px;padding:10px;font-size:11px;color:var(--tx3);margin-bottom:12px;">
                Setup: ${p.setup}
              </div>
              <input type="password" class="finp cal-key-input" id="cal-key-${p.id}" placeholder="${p.placeholder}" style="font-size:11px;margin-bottom:8px;">
              <button class="btn btn-primary btn-sm btn-cal-connect" data-provider="${p.id}" data-name="${p.name}" style="width:100%;">Verbinden</button>
            `}
          </div>`;
        }).join('')}
      </div>
    `;

    // Bind connect buttons
    container.querySelectorAll('.btn-cal-connect').forEach(btn => {
      btn.addEventListener('click', async () => {
        const providerId = btn.dataset.provider;
        const providerName = btn.dataset.name;
        const keyInput = document.getElementById('cal-key-' + providerId);
        const key = keyInput?.value?.trim();
        if (!key || key.length < 5) {
          Components.toast('Bitte gültigen API-Key / Client ID eingeben.', 'error');
          return;
        }
        btn.disabled = true;
        btn.textContent = 'Verbinde...';

        let encRef = null;
        try {
          const { data } = await supabaseClient.functions.invoke('encrypt-secret', {
            body: { provider: providerId, secret: key }
          });
          encRef = data?.ref;
        } catch { /* fallback */ }

        const saved = await this._saveConnection(providerId, providerName, 'Kalender', {
          type: 'calendar',
          key_last4: '...' + key.slice(-4),
          encrypted_key_ref: encRef
        });
        if (saved) {
          Components.toast(providerName + ' verbunden!', 'success');
          this.renderCalendarSync(container);
        } else {
          btn.disabled = false;
          btn.textContent = 'Verbinden';
        }
      });
    });

    // Bind disconnect buttons
    container.querySelectorAll('.btn-cal-disconnect').forEach(btn => {
      btn.addEventListener('click', async () => {
        const providerId = btn.dataset.provider;
        if (!confirm('Kalender-Verbindung wirklich trennen?')) return;
        if (await this._disconnect(providerId)) {
          Components.toast('Kalender getrennt.', 'success');
          this.renderCalendarSync(container);
        }
      });
    });
  },

  // ==========================================
  // EMAIL (SendGrid / Resend)
  // ==========================================

  async renderEmailSettings(container) {
    if (!container) return;
    const conn = await this._getConnection('email_resend');
    const isConnected = !!conn;

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="width:48px;height:48px;border-radius:12px;background:#00b4d822;display:flex;align-items:center;justify-content:center;font-size:24px;">✉️</div>
        <div>
          <h3 style="margin:0;font-size:16px;">E-Mail-Versand</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--tx3);">Automatischer Versand von Follow-ups, Rechnungen und Benachrichtigungen</p>
        </div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:16px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Status: <span style="color:${isConnected ? '#4ade80' : '#f59e0b'};">${isConnected ? 'Verbunden' : 'Nicht konfiguriert'}</span></div>
        ${isConnected ? `
          <p style="font-size:12px;color:var(--tx3);margin:0;">Provider: <strong>${clanaUtils.sanitizeHtml(conn.config?.email_provider || 'Resend')}</strong></p>
          <p style="font-size:12px;color:var(--tx3);margin:4px 0 0;">Verbunden seit ${conn.connected_at ? new Date(conn.connected_at).toLocaleDateString('de-DE') : '-'}</p>
        ` : `
          <p style="font-size:12px;color:var(--tx3);margin:0 0 12px;">Wähle einen E-Mail-Provider und gib den API-Key ein.</p>
          <div style="margin-bottom:8px;">
            <label style="font-size:11px;font-weight:600;color:var(--tx3);display:block;margin-bottom:4px;">Provider</label>
            <select id="email-provider-select" class="finp" style="font-size:12px;">
              <option value="resend">Resend (empfohlen)</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
            </select>
          </div>
          <div style="margin-bottom:8px;">
            <label style="font-size:11px;font-weight:600;color:var(--tx3);display:block;margin-bottom:4px;">API-Key</label>
            <input type="password" id="email-key-input" class="finp" placeholder="re_... / SG. ..." style="font-family:monospace;font-size:12px;">
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;color:var(--tx3);display:block;margin-bottom:4px;">Absender-E-Mail</label>
            <input type="email" id="email-from-input" class="finp" placeholder="noreply@deine-domain.de" style="font-size:12px;">
          </div>
        `}
      </div>
      <div style="display:flex;gap:8px;">
        ${isConnected ? `
          <button class="btn btn-outline btn-sm" id="btn-email-test">Test-E-Mail senden</button>
          <button class="btn btn-outline btn-sm" id="btn-email-disconnect" style="color:#ef4444;border-color:#ef444444;">Trennen</button>
        ` : `
          <button class="btn btn-primary btn-sm" id="btn-email-connect">E-Mail verbinden</button>
        `}
      </div>
    `;

    if (isConnected) {
      document.getElementById('btn-email-disconnect')?.addEventListener('click', async () => {
        if (!confirm('E-Mail-Verbindung trennen?')) return;
        if (await this._disconnect('email_resend')) {
          Components.toast('E-Mail-Verbindung getrennt.', 'success');
          this.renderEmailSettings(container);
        }
      });
      document.getElementById('btn-email-test')?.addEventListener('click', async () => {
        try {
          const user = await clanaAuth.getUser();
          Components.toast('Test-E-Mail wird gesendet an ' + user.email + '...', 'success');
          const { error } = await supabaseClient.functions.invoke('send-welcome-email', {
            body: { email: user.email, firstName: 'Test' }
          });
          if (error) throw error;
          Components.toast('Test-E-Mail gesendet!', 'success');
        } catch (err) {
          Components.toast('Fehler: ' + (err.message || 'E-Mail konnte nicht gesendet werden'), 'error');
        }
      });
    } else {
      document.getElementById('btn-email-connect')?.addEventListener('click', async () => {
        const provider = document.getElementById('email-provider-select')?.value;
        const key = document.getElementById('email-key-input')?.value?.trim();
        const from = document.getElementById('email-from-input')?.value?.trim();
        if (!key || key.length < 10) {
          Components.toast('Bitte einen gültigen API-Key eingeben.', 'error');
          return;
        }

        let encRef = null;
        try {
          const { data } = await supabaseClient.functions.invoke('encrypt-secret', {
            body: { provider: 'email_' + provider, secret: key }
          });
          encRef = data?.ref;
        } catch { /* fallback */ }

        const saved = await this._saveConnection('email_resend', 'E-Mail (' + provider + ')', 'Kommunikation', {
          type: 'email',
          email_provider: provider,
          from_email: from || '',
          key_last4: '...' + key.slice(-4),
          encrypted_key_ref: encRef
        });
        if (saved) {
          Components.toast('E-Mail-Versand verbunden!', 'success');
          this.renderEmailSettings(container);
        }
      });
    }
  },

  // ==========================================
  // KNOWLEDGE BASE FILE UPLOAD
  // ==========================================

  renderFileUpload(container) {
    if (!container) return;
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="width:48px;height:48px;border-radius:12px;background:#10b98122;display:flex;align-items:center;justify-content:center;font-size:24px;">📁</div>
        <div>
          <h3 style="margin:0;font-size:16px;">Wissensdatenbank</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--tx3);">Lade Dokumente hoch, die deine KI-Assistenten als Wissensbasis nutzen</p>
        </div>
      </div>
      <div id="kb-upload-area" style="border:2px dashed var(--border);border-radius:12px;padding:30px;text-align:center;cursor:pointer;transition:border-color .2s;">
        <input type="file" id="kb-file-input" style="display:none;" accept=".pdf,.docx,.txt,.md">
        <div style="font-size:28px;margin-bottom:8px;">📄</div>
        <div style="font-size:13px;font-weight:600;">Datei hierher ziehen oder klicken</div>
        <div style="font-size:11px;color:var(--tx3);margin-top:4px;">PDF, DOCX, TXT, MD — max. 10 MB</div>
      </div>
      <div id="kb-file-list" style="margin-top:12px;"></div>
    `;

    const uploadArea = document.getElementById('kb-upload-area');
    const fileInput = document.getElementById('kb-file-input');
    if (uploadArea) {
      uploadArea.addEventListener('mouseenter', () => { uploadArea.style.borderColor = 'var(--pu)'; });
      uploadArea.addEventListener('mouseleave', () => { uploadArea.style.borderColor = 'var(--border)'; });
      uploadArea.addEventListener('click', () => { fileInput?.click(); });
    }
    if (fileInput) {
      fileInput.addEventListener('change', () => { IntegrationsHub.handleFileUpload(fileInput); });
    }

    // Load existing files
    clanaAuth.getUser().then(user => { if (user) this.loadFileList(user.id); }).catch(() => {});
  },

  async handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { Components.toast('Datei zu groß (max. 10 MB)', 'error'); return; }

    try {
      const user = await clanaAuth.getUser();
      if (!user) throw new Error('Not authenticated');

      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabaseClient.storage.from('knowledge-base').upload(path, file);

      if (error) throw error;
      Components.toast('Datei hochgeladen: ' + file.name, 'success');
      this.loadFileList(user.id);
    } catch (err) {
      Components.toast('Upload fehlgeschlagen: ' + (err.message || 'Bucket existiert möglicherweise nicht'), 'error');
    }
    input.value = '';
  },

  async loadFileList(userId) {
    const list = document.getElementById('kb-file-list');
    if (!list) return;
    try {
      const { data, error } = await supabaseClient.storage.from('knowledge-base').list(userId);
      if (error) throw error;
      if (!data?.length) { list.innerHTML = '<div style="color:var(--tx3);font-size:12px;">Keine Dateien hochgeladen.</div>'; return; }

      list.innerHTML = data.map(f => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;">
          <span>📄 ${clanaUtils.sanitizeHtml(f.name)}</span>
          <span style="color:var(--tx3);">${(f.metadata?.size / 1024).toFixed(1)} KB</span>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = '<div style="color:var(--tx3);font-size:12px;">Storage-Bucket nicht verfügbar.</div>';
    }
  },

  // ==========================================
  // TWILIO / PHONE NUMBERS
  // ==========================================

  async renderPhoneSettings(container) {
    if (!container) return;
    const conn = await this._getConnection('twilio');
    const isConnected = !!conn;

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="width:48px;height:48px;border-radius:12px;background:#f2282222;display:flex;align-items:center;justify-content:center;font-size:24px;">📞</div>
        <div>
          <h3 style="margin:0;font-size:16px;">Telefonnummern (Twilio)</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--tx3);">Echte Telefonnummern für deine KI-Assistenten kaufen und verwalten</p>
        </div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:16px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Status: <span style="color:${isConnected ? '#4ade80' : '#f59e0b'};">${isConnected ? 'Verbunden' : 'Nicht konfiguriert'}</span></div>
        ${isConnected ? `
          <p style="font-size:12px;color:var(--tx3);margin:0;">Account SID: ...${clanaUtils.sanitizeHtml(conn.config?.sid_last4 || '****')}</p>
        ` : `
          <p style="font-size:12px;color:var(--tx3);margin:0 0 12px;">Verbinde deinen Twilio-Account für Telefonnummern-Management.</p>
          <div style="margin-bottom:8px;">
            <label style="font-size:11px;font-weight:600;color:var(--tx3);display:block;margin-bottom:4px;">Account SID</label>
            <input type="text" id="twilio-sid-input" class="finp" placeholder="AC..." style="font-family:monospace;font-size:12px;">
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;color:var(--tx3);display:block;margin-bottom:4px;">Auth Token</label>
            <input type="password" id="twilio-token-input" class="finp" placeholder="Auth Token" style="font-family:monospace;font-size:12px;">
          </div>
        `}
      </div>
      <div style="display:flex;gap:8px;">
        ${isConnected ? `
          <button class="btn btn-outline btn-sm" id="btn-twilio-disconnect" style="color:#ef4444;border-color:#ef444444;">Trennen</button>
        ` : `
          <button class="btn btn-primary btn-sm" id="btn-twilio-connect">Twilio verbinden</button>
        `}
      </div>
    `;

    if (isConnected) {
      document.getElementById('btn-twilio-disconnect')?.addEventListener('click', async () => {
        if (!confirm('Twilio-Verbindung trennen?')) return;
        if (await this._disconnect('twilio')) {
          Components.toast('Twilio getrennt.', 'success');
          this.renderPhoneSettings(container);
        }
      });
    } else {
      document.getElementById('btn-twilio-connect')?.addEventListener('click', async () => {
        const sid = document.getElementById('twilio-sid-input')?.value?.trim();
        const token = document.getElementById('twilio-token-input')?.value?.trim();
        if (!sid || !token || sid.length < 10) {
          Components.toast('Bitte gültige Twilio-Zugangsdaten eingeben.', 'error');
          return;
        }

        let encRef = null;
        try {
          const { data } = await supabaseClient.functions.invoke('encrypt-secret', {
            body: { provider: 'twilio', secret: token }
          });
          encRef = data?.ref;
        } catch { /* fallback */ }

        const saved = await this._saveConnection('twilio', 'Twilio', 'Telefonie', {
          type: 'twilio',
          sid_last4: sid.slice(-4),
          encrypted_token_ref: encRef
        });
        if (saved) {
          Components.toast('Twilio verbunden!', 'success');
          this.renderPhoneSettings(container);
        }
      });
    }
  }
};

window.IntegrationsHub = IntegrationsHub;
