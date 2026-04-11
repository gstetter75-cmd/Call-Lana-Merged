// ==========================================
// Global Error Handler: Offline detection, retry banner, error boundaries
// Depends on: nothing (standalone, loads early)
// ==========================================

const ErrorHandler = {

  _bannerEl: null,
  _isOffline: false,
  _retryCallbacks: [],

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this._setOnline());
    window.addEventListener('offline', () => this._setOffline());

    // Check initial state
    if (!navigator.onLine) this._setOffline();

    // Intercept fetch errors globally for Supabase detection
    this._patchFetch();
  },

  _setOffline() {
    if (this._isOffline) return;
    this._isOffline = true;
    this._showBanner('Keine Internetverbindung. Daten können nicht geladen werden.', 'error');
  },

  _setOnline() {
    if (!this._isOffline) return;
    this._isOffline = false;
    this._hideBanner();
    // Auto-retry registered callbacks
    this._retryCallbacks.forEach(fn => {
      try { fn(); } catch (e) { /* ignore retry errors */ }
    });
  },

  // Show a non-blocking banner at the top of the page
  _showBanner(message, type) {
    this._hideBanner();
    const banner = document.createElement('div');
    banner.id = 'error-banner';
    const bgColor = type === 'error' ? 'rgba(248,113,113,.12)' : 'rgba(251,146,60,.12)';
    const borderColor = type === 'error' ? 'rgba(248,113,113,.4)' : 'rgba(251,146,60,.4)';
    const textColor = type === 'error' ? '#dc2626' : '#d97706';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;padding:10px 20px;' +
      'background:' + bgColor + ';border-bottom:1px solid ' + borderColor + ';' +
      'display:flex;align-items:center;justify-content:center;gap:12px;' +
      'font-size:13px;font-weight:600;color:' + textColor + ';font-family:Manrope,sans-serif;' +
      'backdrop-filter:blur(8px);';
    const safeMsg = typeof clanaUtils !== 'undefined' ? clanaUtils.sanitizeHtml(message) : message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Erneut versuchen';
    retryBtn.style.cssText = 'background:' + textColor + ';color:white;border:none;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;';
    retryBtn.addEventListener('click', () => ErrorHandler.retry());
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background:none;border:none;color:' + textColor + ';font-size:18px;cursor:pointer;padding:0 4px;';
    closeBtn.addEventListener('click', () => ErrorHandler._hideBanner());
    banner.appendChild(msgSpan);
    banner.appendChild(retryBtn);
    banner.appendChild(closeBtn);
    document.body.prepend(banner);
    this._bannerEl = banner;
  },

  _hideBanner() {
    const el = document.getElementById('error-banner');
    if (el) el.remove();
    this._bannerEl = null;
  },

  // Register a callback to be retried when connection restores
  onRetry(fn) {
    this._retryCallbacks.push(fn);
  },

  // Manual retry
  retry() {
    this._hideBanner();
    this._retryCallbacks.forEach(fn => {
      try { fn(); } catch (e) { /* ignore */ }
    });
  },

  // Detect Supabase errors in fetch responses + auto-retry on 403
  _patchFetch() {
    const originalFetch = window.fetch;
    let consecutiveErrors = 0;
    let isRefreshing = false;

    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);

        if (response.ok || response.status < 400) {
          consecutiveErrors = 0;
          return response;
        }

        // 403 on Supabase = stale token — auto-refresh and retry once
        if (response.status === 403 && !isRefreshing) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          if (url.includes('supabase.co')) {
            isRefreshing = true;
            try {
              if (typeof supabaseClient !== 'undefined') {
                const { data } = await supabaseClient.auth.refreshSession();
                if (data?.session) {
                  // Update Authorization header with new token
                  const opts = args[1] || {};
                  const headers = new Headers(opts.headers || {});
                  headers.set('Authorization', 'Bearer ' + data.session.access_token);
                  headers.set('apikey', headers.get('apikey') || '');
                  const retryResponse = await originalFetch.call(this, args[0], { ...opts, headers });
                  isRefreshing = false;
                  if (retryResponse.ok) {
                    if (typeof Logger !== 'undefined') Logger.info('ErrorHandler', '403 retry succeeded after token refresh');
                    return retryResponse;
                  }
                }
              }
            } catch (e) { /* ignore refresh failure */ }
            isRefreshing = false;
          }
        }

        if (response.status >= 500) {
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            ErrorHandler._showBanner('Server-Probleme erkannt. Einige Funktionen sind eingeschränkt.', 'warning');
          }
        }
        return response;
      } catch (err) {
        consecutiveErrors++;
        if (consecutiveErrors >= 2 && !ErrorHandler._isOffline) {
          ErrorHandler._showBanner('Verbindungsproblem. Daten können nicht geladen werden.', 'error');
        }
        throw err;
      }
    };
  },

  // Show a specific error for a component (non-blocking)
  showComponentError(containerId, message) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const safeMessage = (message || 'Daten konnten nicht geladen werden.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--tx3);font-size:13px;">' +
      '<div style="font-size:20px;margin-bottom:8px;">⚠️</div>' +
      '<div>' + safeMessage + '</div>' +
      '<button data-action="reload-page" style="margin-top:12px;background:var(--pu);color:white;border:none;' +
      'border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Seite neu laden</button>' +
    '</div>';
    el.querySelector('[data-action="reload-page"]').addEventListener('click', () => location.reload());
  }
};

window.ErrorHandler = ErrorHandler;

// Auto-init when script loads
ErrorHandler.init();
