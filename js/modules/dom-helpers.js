// Null-safe DOM helpers (prevent TypeError when elements don't exist yet)

export function $id(id) { return document.getElementById(id); }
export function $setText(id, text) { const el = $id(id); if (el) el.textContent = text; }
export function $setVal(id, val) { const el = $id(id); if (el) el.value = val; }
export function $setHtml(id, html) { const el = $id(id); if (el) el.innerHTML = html; }
export function $setAttr(id, attr, val) { const el = $id(id); if (el) el.setAttribute(attr, val); }
