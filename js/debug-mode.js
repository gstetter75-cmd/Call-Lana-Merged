// ==========================================
// Debug Mode: Log all Supabase queries to console
// Activate via URL param ?debug=true or localStorage clana_debug=true
// ==========================================

const DebugMode = {
  active: false,
  queryLog: [],

  init() {
    this.active = new URLSearchParams(window.location.search).get('debug') === 'true'
      || localStorage.getItem('clana_debug') === 'true';

    if (!this.active) return;

    console.log('%c[Debug Mode] Aktiv — alle Supabase-Queries werden geloggt', 'color:#7c3aed;font-weight:bold;font-size:14px;');
    this._patchFetch();
    this._showDebugBadge();
  },

  _patchFetch() {
    const originalFetch = window._originalFetch || window.fetch;
    window._originalFetch = originalFetch;
    const self = this;

    window.fetch = async function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

      // Only log Supabase requests
      if (!url.includes('supabase.co')) {
        return originalFetch.apply(this, args);
      }

      const start = performance.now();
      const method = args[1]?.method || 'GET';

      // Extract table name from URL
      const match = url.match(/rest\/v1\/(\w+)/);
      const table = match ? match[1] : 'rpc';

      try {
        const response = await originalFetch.apply(this, args);
        const duration = Math.round(performance.now() - start);
        const status = response.status;

        const entry = { method, table, status, duration, url, timestamp: new Date().toISOString() };
        self.queryLog.push(entry);

        const color = status < 300 ? '#10b981' : status < 400 ? '#f59e0b' : '#ef4444';
        console.log(
          `%c${method} %c${table} %c${status} %c${duration}ms`,
          'color:#7c3aed;font-weight:bold;',
          'color:inherit;font-weight:bold;',
          `color:${color};font-weight:bold;`,
          'color:#6b7280;'
        );

        if (status >= 400) {
          try {
            const clone = response.clone();
            const body = await clone.text();
            console.log('%c  Error:', 'color:#ef4444;', body.substring(0, 200));
          } catch { /* ignore */ }
        }

        return response;
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        console.log(
          `%c${method} %c${table} %cFAILED %c${duration}ms %c${err.message}`,
          'color:#7c3aed;font-weight:bold;',
          'color:inherit;font-weight:bold;',
          'color:#ef4444;font-weight:bold;',
          'color:#6b7280;',
          'color:#ef4444;'
        );
        throw err;
      }
    };
  },

  _showDebugBadge() {
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;bottom:8px;left:8px;background:#7c3aed;color:white;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;z-index:9999;font-family:monospace;cursor:pointer;opacity:0.8;';
    badge.textContent = 'DEBUG';
    badge.title = 'Klicken für Query-Log Export';
    badge.addEventListener('click', () => {
      console.table(this.queryLog);
      console.log('Query-Log als JSON:', JSON.stringify(this.queryLog, null, 2));
    });
    document.body.appendChild(badge);
  },

  // Get current token info
  getTokenInfo() {
    try {
      const stored = JSON.parse(localStorage.getItem('sb-fgwtptriileytmmotevs-auth-token') || 'null');
      if (!stored) return { status: 'no session' };
      const token = stored.access_token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = new Date(payload.exp * 1000);
      const remainingMin = Math.round((expiresAt - Date.now()) / 60000);
      return {
        email: payload.email,
        role: payload.user_metadata?.role || 'unknown',
        expiresAt: expiresAt.toLocaleTimeString('de-DE'),
        remainingMin,
        sub: payload.sub,
      };
    } catch { return { status: 'error reading token' }; }
  }
};

// Auto-init
DebugMode.init();
window.DebugMode = DebugMode;
