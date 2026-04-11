// Sales page entrypoint — ES Module bundle entry
import '../modules/core.js';

// --- Auth & DB layer ---
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

// --- Sales feature modules ---
import '../sales-customers.js';
import '../availability.js';
import '../notifications.js';
import '../crm-enhancements.js';
import '../global-search.js';
import '../keyboard-shortcuts.js';
import '../sales.js';
import '../sales-tasks.js';
import '../theme-toggle.js';
import '../idle-timeout.js';
import '../../cookie-consent.js';
