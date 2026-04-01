// Centralized event delegation for data-action attributes.
// Replaces inline onclick handlers with safe, XSS-proof event delegation.

const handlers = {};

export function register(action, handler) {
  handlers[action] = handler;
}

export function registerAll(map) {
  for (const [action, handler] of Object.entries(map)) {
    handlers[action] = handler;
  }
}

export function init() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const handler = handlers[action];
    if (!handler) return;

    e.preventDefault();
    e.stopPropagation();

    const id = target.dataset.id;
    const extra = target.dataset.extra;
    handler(id, extra, target);
  });
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}

export const SafeActions = { register, registerAll, init, _handlers: handlers };
