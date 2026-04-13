# Call Lana — Projekt-Anweisungen

## Architektur

```
Frontend (Vanilla JS + HTML)
    ↓ Supabase Client SDK
Supabase (Auth, DB, Realtime, Storage)
    ↓ Edge Functions
Externe APIs (Stripe, Resend, VAPI)
```

- **Hosting:** Netlify (statisch, Custom Domain: call-lana.de)
- **Backend:** Supabase (44 Tabellen, RLS, Realtime)
- **Edge Functions:** 9 Deno-Functions in `supabase/functions/`
- **Build:** esbuild via `build.js` → `dist/` Bundles

## Lokale Entwicklung

```bash
npm install                    # Dependencies installieren
npm run dev                    # Build + lokaler Server (localhost:8080)
npm run watch                  # JS-Bundles in watch mode
npm run seed                   # Testdaten erstellen (Leads, Calls, Tasks)
```

## Tests

```bash
npm test                       # Vitest Unit Tests (845 Tests)
npm run test:smoke             # Smoke Test: Login, Seiten, DB (55 Checks)
npm run test:e2e               # Playwright E2E Tests (47 Specs, 328 Tests)
npm run test:e2e:fast          # Nur kritische E2E (4 Specs)
npm run test:all               # Unit + Smoke + E2E (critical)
npm run test:ci                # Exakt wie CI: Build + Unit + Smoke + E2E
npm run verify                 # Schnell: Build + Unit + Smoke
```

### Debug-Modus
```bash
# Browser: localhost:8080/admin.html?debug=true
# Loggt alle Supabase-Queries in die Console
# DebugMode.getTokenInfo() zeigt JWT-Details
```

## Projektstruktur

```
├── js/                        # Frontend-Module (je ~100-400 Zeilen)
│   ├── auth.js                # Auth (Login, Signup, Logout)
│   ├── auth-guard.js          # Role-based Routing
│   ├── dashboard.js           # Dashboard-Logik
│   ├── admin*.js              # Admin-Panel Module
│   ├── realtime.js            # Supabase Realtime
│   ├── onboarding.js          # Onboarding-Checklist
│   ├── db/                    # Datenbank-Abstraktionsschicht
│   └── ...
├── supabase/functions/        # Edge Functions (Deno/TypeScript)
│   ├── create-payment-method/ # Stripe Tokenisierung
│   ├── stripe-webhook/        # Stripe Event-Handler
│   ├── send-invoice-email/    # Rechnungsversand (Resend)
│   ├── send-welcome-email/    # Willkommens-E-Mail
│   ├── encrypt-secret/        # AES-256 Verschlüsselung
│   ├── vapi-webhook/          # VAPI Call-Events
│   ├── create-checkout-session/ # Stripe Checkout
│   ├── send-daily-digest/     # Tägliche Zusammenfassung
│   └── send-whatsapp-notification/ # WhatsApp-Benachrichtigungen
├── sql/                       # DB-Migrations (001-039)
├── tests/
│   ├── e2e/                   # Playwright E2E Tests
│   ├── unit/                  # Vitest Unit Tests
│   └── fixtures/              # Test-Fixtures (Auth)
├── css/                       # Stylesheets
├── dist/                      # Build-Output (minified bundles)
└── .github/workflows/ci.yml   # GitHub Actions CI
```

## Konventionen

- **Sprache:** Deutsch für UI/Kommentare, Englisch für Code/Commits
- **Commits:** Conventional Commits (`feat:`, `fix:`, `test:`, etc.)
- **Dateigröße:** Max 400 Zeilen (800 absolutes Maximum)
- **RLS:** Jede Tabelle hat Row Level Security, `is_superadmin()` liest `profiles.role` direkt
- **Keine Secrets im Code** — `.env.test` nur für Testdaten
- **ESM-Module:** Shared Utils in `js/modules/` (toast, format, dom-helpers)
- **Bundles:** esbuild ESM mit Code-Splitting, Lazy Loading für optionale Module

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `SUPABASE_URL` | Supabase Projekt-URL |
| `SUPABASE_ANON_KEY` | Öffentlicher Supabase Key |
| `STRIPE_SECRET_KEY` | Stripe API Key (Edge Functions) |
| `RESEND_API_KEY` | Resend E-Mail API Key |
| `ENCRYPTION_KEY` | AES-256 Schlüssel für Token-Verschlüsselung |
| `VAPI_WEBHOOK_SECRET` | VAPI Webhook-Verifizierung |

## Rollen

| Rolle | Zugriff |
|-------|---------|
| `superadmin` | Alles (admin.html, sales.html, dashboard.html) |
| `sales` | sales.html, dashboard.html |
| `customer` | dashboard.html, settings.html |
