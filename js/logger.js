// Production-safe logger — suppresses detailed output unless debug mode is active
const Logger = (() => {
  const isDebug = localStorage.getItem('debug') === 'true' || location.hostname === 'localhost';

  return {
    error(context, err) {
      if (isDebug) {
        console.error(`[${context}]`, err);
      }
      // In production: could send to external logging service
      // e.g., fetch('/api/log', { method: 'POST', body: JSON.stringify({ context, message: err?.message, stack: err?.stack }) });
    },
    warn(context, msg) {
      if (isDebug) console.warn(`[${context}]`, msg);
    },
    info(context, msg) {
      if (isDebug) console.info(`[${context}]`, msg);
    }
  };
})();
