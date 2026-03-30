// Lightweight error tracking — sends unhandled errors to Supabase error_logs.
// Rate limited to max 5 errors per minute per session.
// Include after supabase-init.js on protected pages only.

(function initErrorTracker() {
  'use strict';

  const MAX_ERRORS_PER_MINUTE = 5;
  const WINDOW_MS = 60000;
  let errorTimestamps = [];
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

  function isRateLimited() {
    const now = Date.now();
    errorTimestamps = errorTimestamps.filter((t) => now - t < WINDOW_MS);
    if (errorTimestamps.length >= MAX_ERRORS_PER_MINUTE) {
      return true;
    }
    errorTimestamps.push(now);
    return false;
  }

  function shouldIgnore(message, source) {
    if (typeof message === 'string' && /404/.test(message)) return true;
    if (typeof source === 'string' && !source.includes(location.hostname)) return true;
    return false;
  }

  function getUserId() {
    try {
      const session = supabaseClient?.auth?.session?.() ?? null;
      if (session?.user?.id) return session.user.id;
      // Fallback: check stored session
      const stored = JSON.parse(localStorage.getItem('sb-fgwtptriileytmmotevs-auth-token') || 'null');
      return stored?.user?.id || null;
    } catch {
      return null;
    }
  }

  async function sendError(payload) {
    try {
      if (typeof supabaseClient === 'undefined') return;
      await supabaseClient.from('error_logs').insert(payload);
    } catch {
      // Silently fail — we must not cause additional errors
    }
  }

  function buildPayload(message, source, lineno, colno, stack) {
    return {
      service: 'frontend',
      severity: 'error',
      message: String(message).slice(0, 2000),
      stack_trace: stack ? String(stack).slice(0, 4000) : null,
      metadata: {
        session_id: sessionId,
        user_id: getUserId(),
        page: location.href,
        user_agent: navigator.userAgent,
        source: source || null,
        line: lineno || null,
        column: colno || null,
      },
    };
  }

  window.onerror = function (message, source, lineno, colno, error) {
    if (shouldIgnore(message, source)) return;
    if (isRateLimited()) return;
    const stack = error?.stack || null;
    sendError(buildPayload(message, source, lineno, colno, stack));
  };

  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    const message = reason?.message || String(reason);
    const source = reason?.fileName || null;
    if (shouldIgnore(message, source)) return;
    if (isRateLimited()) return;
    const stack = reason?.stack || null;
    sendError(buildPayload(message, source, null, null, stack));
  });
})();
