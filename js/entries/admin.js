// Admin page entrypoint — ES Module bundle entry
// Imports core (establishes all window globals), then loads legacy feature scripts.

import '../modules/core.js';

// Legacy scripts loaded in dependency order.
// These still use window globals but benefit from bundling (single HTTP request).
// Phase 2 of migration: convert each to ES Module imports.

/* eslint-disable */
// --- Foundation (already provided by core.js) ---
// Logger, supabaseClient, clanaUtils, CONFIG, SafeActions, openModal, closeModal

// --- Auth & DB layer (still window-global scripts) ---
import '../error-handler.js';
import '../error-tracker.js';
import '../auth.js';
import '../db/calls.js';
import '../db/assistants.js';
import '../db/profiles.js';
import '../db/leads.js';
import '../db/messaging.js';
import '../db/customers.js';
import '../db/tools.js';
import '../db.js';
import '../auth-guard.js';
import '../dashboard-components.js';

// --- Admin feature modules ---
import '../admin-analytics.js';
import '../admin-overview.js';
import '../admin-audit.js';
import '../admin-pdf-export.js';
import '../admin-health.js';
import '../admin-extra.js';
import '../admin-bulk.js';
import '../integrations-hub.js';
import '../global-search.js';
import '../keyboard-shortcuts.js';
import '../admin.js';
import '../admin-stats.js';
import '../theme-toggle.js';
import '../idle-timeout.js';
import '../../cookie-consent.js';
