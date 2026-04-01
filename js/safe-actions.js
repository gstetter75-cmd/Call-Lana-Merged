// safe-actions.js — Centralized event delegation for data-action attributes.
// Replaces inline onclick handlers with safe, XSS-proof event delegation.
// Usage: Register actions, then use data-action="name" data-id="value" in HTML.
//
// Example:
//   SafeActions.register('view-customer', (id) => viewCustomer(id));
//   <tr data-action="view-customer" data-id="${clanaUtils.sanitizeAttr(c.id)}">

const SafeActions = {
  _handlers: {},

  register(action, handler) {
    this._handlers[action] = handler;
  },

  registerAll(map) {
    for (const [action, handler] of Object.entries(map)) {
      this._handlers[action] = handler;
    }
  },

  init() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const handler = this._handlers[action];
      if (!handler) return;

      e.preventDefault();
      e.stopPropagation();

      // Pass all data-* attributes as parameters
      const id = target.dataset.id;
      const extra = target.dataset.extra;
      handler(id, extra, target);
    });
  }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SafeActions.init());
} else {
  SafeActions.init();
}

window.SafeActions = SafeActions;
