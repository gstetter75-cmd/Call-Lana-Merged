// Shared utility functions — single source of truth for sanitization, formatting, validation

export function sanitizeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

export function sanitizeAttr(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '&#92;');
}

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[+]?[\d\s()-]{6,20}$/.test(phone);
}

export function safeTelHref(phone) {
  const clean = (phone || '').replace(/[^+\d\s\-()]/g, '');
  return clean ? 'tel:' + clean : '#';
}

export function safeMailHref(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'mailto:' + email : '#';
}

// Convenience alias used throughout as escHtml
export const escHtml = sanitizeHtml;
