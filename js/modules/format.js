// Shared formatting utilities

export function formatMinutes(seconds) {
  if (!seconds || seconds === 0) return '0 min';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return s + ' sek';
  return m + ':' + String(s).padStart(2, '0') + ' min';
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function formatCents(cents) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}
