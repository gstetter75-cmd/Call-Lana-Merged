// Dashboard page entrypoint — ES Module bundle entry
// Core modules load immediately, feature modules load lazily on tab navigation
import '../modules/core.js';

// --- Auth & DB layer (required immediately) ---
import '../impersonation.js';
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

// --- Core dashboard (required for init + home page) ---
import '../dashboard.js';
import '../dashboard-home-data.js';
import '../dashboard-home-widgets.js';
import '../dashboard-assistants.js';
import '../onboarding.js';
import '../notifications.js';
import '../realtime.js';
import '../global-search.js';
import '../keyboard-shortcuts.js';
import '../theme-toggle.js';
import '../idle-timeout.js';
import '../debug-mode.js';
import '../../cookie-consent.js';

// --- Lazy-loaded feature modules (loaded on first tab navigation) ---
// These are loaded dynamically in dashboard.js navigateToPage() lazy-loading section.
// Keeping static imports as fallback ensures they're in the bundle for:
// 1. Direct URL access (e.g. #billing)
// 2. SafeActions that reference these functions
import '../dashboard-calls.js';
import '../dashboard-billing.js';
import '../dashboard-payment.js';
import '../dashboard-team.js';
import '../dashboard-integrations.js';
import '../dashboard-extras.js';
import '../dashboard-analytics.js';
import '../dashboard-charts.js';
import '../appointments.js';
import '../analytics-page.js';
import '../invoices.js';

// --- Optional (PWA, offline, confetti) ---
import '../confetti.js';
import '../push-notifications.js';
import '../offline-cache.js';
import '../install-prompt.js';
import '../integration-demo.js';
