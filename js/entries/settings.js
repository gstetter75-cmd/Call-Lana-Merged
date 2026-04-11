// Settings page entrypoint — ES Module bundle entry
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

// --- Settings feature modules ---
import '../settings.js';
import '../settings-extra.js';
import '../referral.js';
import '../theme-toggle.js';
import '../idle-timeout.js';
import '../debug-mode.js';
import '../../cookie-consent.js';
