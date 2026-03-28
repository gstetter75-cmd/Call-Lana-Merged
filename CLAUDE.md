# Call Lana — Projekt-Anweisungen

## Architektur

```
Frontend (Vanilla JS + HTML)
    ↓ Supabase Client SDK
Supabase (Auth, DB, Realtime, Storage)
    ↓ Edge Functions
Externe APIs (Stripe, Resend, VAPI)
```

- **Hosting:** GitHub Pages (statisch)
- **Backend:** Supabase (44 Tabellen, RLS, Realtime)
- **Edge Functions:** 7 Deno-Functions in `supabase/functions/`
- **Build:** esbuild via `build.js` → `dist/` Bundles

## Lokale Entwicklung

```bash
npm install                    # Dependencies installieren
npx http-server -p 8080       # Lokaler Dev-Server
node build.js --watch          # JS-Bundles in watch mode
```

## Tests

```bash
npm run test:unit              # Vitest Unit Tests (21 Tests)
npm test                       # Playwright E2E Tests (124 Tests)
npm run test:all               # Beides
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
│   └── create-checkout-session/ # Stripe Checkout
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
- **RLS:** Jede Tabelle hat Row Level Security, `is_superadmin()` für Admin-Zugriff
- **Keine Secrets im Code** — `.env.test` nur für Testdaten

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
