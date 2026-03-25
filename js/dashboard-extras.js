// ==========================================
// Dashboard Extras: Transcript Search, Favorites, Help Tooltips, Activity Log
// ==========================================

const DashboardExtras = {

  // ==========================================
  // TRANSCRIPT SEARCH
  // ==========================================

  async searchTranscripts(query) {
    if (!query || query.length < 3) return [];
    try {
      const user = await clanaAuth.getUser();
      if (!user) return [];
      const { data } = await supabaseClient
        .from('calls')
        .select('id, phone_number, created_at, transcript, status, duration')
        .eq('user_id', user.id)
        .ilike('transcript', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    } catch (e) { return []; }
  },

  renderTranscriptSearch(container) {
    if (!container) return;
    container.innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="text" id="transcript-search-input" class="form-input" placeholder="Transkripte durchsuchen…" style="flex:1;" onkeydown="if(event.key==='Enter')DashboardExtras.doTranscriptSearch()">
          <button class="btn btn-sm" onclick="DashboardExtras.doTranscriptSearch()">Suchen</button>
        </div>
        <div id="transcript-search-results" style="margin-top:12px;"></div>
      </div>
    `;
  },

  async doTranscriptSearch() {
    const query = document.getElementById('transcript-search-input')?.value?.trim();
    const container = document.getElementById('transcript-search-results');
    if (!container) return;
    if (!query || query.length < 3) { container.innerHTML = '<div style="color:var(--tx3);font-size:12px;">Mindestens 3 Zeichen eingeben.</div>'; return; }

    container.innerHTML = '<div style="color:var(--tx3);font-size:12px;">Suche…</div>';
    const results = await this.searchTranscripts(query);

    if (!results.length) {
      container.innerHTML = '<div style="color:var(--tx3);font-size:12px;">Keine Treffer.</div>';
      return;
    }

    container.innerHTML = results.map(r => {
      const excerpt = this.highlightMatch(r.transcript || '', query);
      return `
        <div style="padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;transition:background .15s;" onmouseenter="this.style.background='var(--bg3)'" onmouseleave="this.style.background=''">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
            <span style="color:var(--tx3);">${r.phone_number || '—'}</span>
            <span style="color:var(--tx3);">${new Date(r.created_at).toLocaleDateString('de-DE')}</span>
          </div>
          <div style="font-size:12px;line-height:1.4;">${excerpt}</div>
        </div>
      `;
    }).join('');
  },

  highlightMatch(text, query) {
    const maxLen = 200;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, maxLen);

    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + query.length + 60);
    let excerpt = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');

    // Highlight
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    excerpt = excerpt.replace(re, '<mark style="background:#7c3aed33;color:var(--pu);border-radius:2px;padding:0 2px;">$1</mark>');
    return excerpt;
  },

  // ==========================================
  // ASSISTANT FAVORITES / PINNING
  // ==========================================

  getFavorites() {
    try { return JSON.parse(localStorage.getItem('calllana_fav_assistants') || '[]'); }
    catch { return []; }
  },

  toggleFavorite(assistantId) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(assistantId);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.unshift(assistantId);
    localStorage.setItem('calllana_fav_assistants', JSON.stringify(favs));
    return idx < 0;
  },

  isFavorite(assistantId) {
    return this.getFavorites().includes(assistantId);
  },

  // ==========================================
  // HELP TOOLTIPS
  // ==========================================

  tooltips: {
    'page-home': 'Übersicht über alle deine Anrufe, Guthaben und Assistenten.',
    'page-assistants': 'Erstelle und verwalte deine KI-Telefon-Assistenten.',
    'page-transactions': 'Alle ein- und ausgehenden Anrufe mit Details.',
    'page-billing': 'Dein Guthaben und Rechnungen verwalten.',
    'page-knowledge': 'Lade Dokumente hoch als Wissensbasis für deine Assistenten.'
  },

  initHelpTooltips() {
    // Show tooltip on first visit
    const seen = localStorage.getItem('calllana_tooltips_seen');
    if (seen) return;

    setTimeout(() => {
      const tip = document.createElement('div');
      tip.id = 'help-tooltip';
      tip.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--pu);color:white;padding:14px 18px;border-radius:12px;font-size:12px;max-width:280px;z-index:250;box-shadow:0 8px 24px rgba(124,58,237,.4);';
      tip.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;">💡 Tipp</div>
        <div>Drücke <kbd style="background:rgba(255,255,255,.2);border-radius:3px;padding:1px 6px;">/</kbd> für die Suche oder <kbd style="background:rgba(255,255,255,.2);border-radius:3px;padding:1px 6px;">?</kbd> für Keyboard Shortcuts.</div>
        <button onclick="this.parentElement.remove();localStorage.setItem('calllana_tooltips_seen','1')" style="background:rgba(255,255,255,.2);border:none;color:white;padding:4px 12px;border-radius:6px;cursor:pointer;margin-top:8px;font-size:11px;">Verstanden</button>
      `;
      document.body.appendChild(tip);
    }, 3000);
  },

  // ==========================================
  // USER ACTIVITY LOG (recent actions)
  // ==========================================

  actions: [],

  logAction(action) {
    this.actions.unshift({ text: action, time: new Date() });
    if (this.actions.length > 20) this.actions.pop();
    try {
      localStorage.setItem('calllana_recent_actions', JSON.stringify(this.actions.slice(0, 10)));
    } catch (e) {}
  },

  loadRecentActions() {
    try {
      const stored = JSON.parse(localStorage.getItem('calllana_recent_actions') || '[]');
      this.actions = stored.map(a => ({ ...a, time: new Date(a.time) }));
    } catch (e) { this.actions = []; }
  },

  renderActivityLog(container) {
    if (!container) return;
    this.loadRecentActions();

    container.innerHTML = `
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Deine letzten Aktionen</div>
      ${this.actions.length ? this.actions.slice(0, 8).map(a => `
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;border-bottom:1px solid var(--border);">
          <span>${a.text}</span>
          <span style="color:var(--tx3);">${new Date(a.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      `).join('') : '<div style="color:var(--tx3);font-size:11px;">Noch keine Aktionen.</div>'}
    `;
  }
};

window.DashboardExtras = DashboardExtras;
