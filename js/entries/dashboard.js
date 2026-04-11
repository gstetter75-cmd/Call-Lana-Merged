// Dashboard page entrypoint — ES Module bundle entry
import '../modules/core.js';

// --- Auth & DB layer ---
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

// --- Dashboard feature modules ---
import '../dashboard.js';
import '../dashboard-assistants.js';
import '../dashboard-calls.js';
import '../dashboard-home-data.js';
import '../dashboard-team.js';
import '../dashboard-billing.js';
import '../dashboard-integrations.js';
import '../dashboard-payment.js';
import '../confetti.js';
import '../onboarding.js';
import '../notifications.js';
import '../integration-demo.js';
import '../push-notifications.js';
import '../offline-cache.js';
import '../install-prompt.js';
import '../dashboard-extras.js';
import '../dashboard-analytics.js';
import '../dashboard-home-widgets.js';
import '../dashboard-charts.js';
import '../appointments.js';
import '../analytics-page.js';
import '../realtime.js';
import '../global-search.js';
import '../keyboard-shortcuts.js';
import '../invoices.js';
import '../theme-toggle.js';
import '../idle-timeout.js';
import '../../cookie-consent.js';
