// Centralized error boundary for async operations
// Provides consistent error handling, logging, and user feedback

export async function safeAsync(fn, options = {}) {
  const { context = 'unknown', silent = false, fallback = null } = options;
  try {
    return await fn();
  } catch (error) {
    if (typeof Logger !== 'undefined') {
      Logger.error(context, error);
    }
    if (!silent && typeof window.Components !== 'undefined') {
      const msg = error.message || 'Ein Fehler ist aufgetreten.';
      window.Components.toast(msg, 'error');
    } else if (!silent && typeof window.showToast === 'function') {
      window.showToast(error.message || 'Ein Fehler ist aufgetreten.', true);
    }
    return fallback;
  }
}

// Wraps a clanaDB result and shows error if not successful
export async function safeDbCall(dbPromise, options = {}) {
  const { context = 'DB', silent = false, fallback = null } = options;
  try {
    const result = await dbPromise;
    if (result && !result.success) {
      if (!silent) {
        const msg = result.error || 'Daten konnten nicht geladen werden.';
        if (typeof window.Components !== 'undefined') {
          window.Components.toast(msg, 'error');
        } else if (typeof window.showToast === 'function') {
          window.showToast(msg, true);
        }
      }
      if (typeof Logger !== 'undefined') {
        Logger.warn(context, result.error);
      }
      return fallback;
    }
    return result?.data ?? result;
  } catch (error) {
    if (typeof Logger !== 'undefined') Logger.error(context, error);
    if (!silent) {
      if (typeof window.Components !== 'undefined') {
        window.Components.toast(error.message || 'Verbindungsfehler.', 'error');
      }
    }
    return fallback;
  }
}
