// Core module — imports all foundation modules and exposes them as window globals.
// This is the bridge between ES Modules and the legacy window-global code.
// Feature modules still use window.* globals but this file is the single
// import point that establishes them.

import { Logger } from './logger.js';
import { supabaseClient } from './supabase-init.js';
import * as utils from './utils.js';
import { PRICING } from './pricing-data.js';
import { CONFIG } from './config.js';
import { openModal, closeModal, initModalListeners } from './modal.js';
import { SafeActions } from './safe-actions.js';

// Establish window globals for legacy code
window.Logger = Logger;
window.supabaseClient = supabaseClient;
window.PRICING = PRICING;
window.CONFIG = CONFIG;
window.openModal = openModal;
window.closeModal = closeModal;
window.SafeActions = SafeActions;

// clanaUtils — single source of truth
window.clanaUtils = {
  sanitizeHtml: utils.sanitizeHtml,
  sanitizeAttr: utils.sanitizeAttr,
  formatDuration: utils.formatDuration,
  formatDate: utils.formatDate,
  validateEmail: utils.validateEmail,
  validatePhone: utils.validatePhone,
  safeTelHref: utils.safeTelHref,
  safeMailHref: utils.safeMailHref,
};

// escHtml alias used in many feature modules
window.escHtml = utils.sanitizeHtml;

// Init modal listeners
initModalListeners();

// Re-export for direct ES module consumers
export { Logger, supabaseClient, CONFIG, PRICING, openModal, closeModal, SafeActions };
export { sanitizeHtml, sanitizeAttr, formatDate, formatDuration, escHtml } from './utils.js';
