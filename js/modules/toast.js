// Shared toast notification for dashboard and settings pages
// Uses #toast element (simple text toast) — different from Components.toast (styled)

export function showToast(msg, isError) {
  const t = document.getElementById('toast');
  if (!t) {
    // Fallback to Components.toast if available
    if (typeof window.Components !== 'undefined' && window.Components.toast) {
      window.Components.toast(msg, isError ? 'error' : 'success');
    }
    return;
  }
  t.textContent = (isError ? '⚠️ ' : '✅ ') + msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 3000);
}
