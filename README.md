# Call Lana — KI-Telefonassistent

> KI-gestützter Telefonassistent für Unternehmen. Anrufe annehmen, Termine buchen, Kunden begeistern.

## Quick Start

```bash
git clone https://github.com/gstetter75-cmd/Call-Lana-Merged.git
cd Call-Lana-Merged
npm install
npm run dev                       # Build + Dev-Server (localhost:8080)
npm run seed                      # Testdaten erstellen
```

## Testing (1.363+ automatische Tests)

```bash
npm run verify         # Build + 978 Unit Tests + 57 Smoke Checks (~30s)
npm run test:e2e       # 328 Playwright E2E Tests
npm run test:ci        # Full CI Simulation
```

## Debug

`localhost:8080/dashboard.html?debug=true` — loggt alle Supabase-Queries in der Console.

## Architektur

```
┌─────────────────────────────────────────────────┐
│  Frontend (Vanilla JS + HTML, GitHub Pages)      │
│  ├── Dashboard  ├── Admin  ├── Sales  ├── Auth  │
└──────────────────────┬──────────────────────────┘
                       │ Supabase SDK
┌──────────────────────▼──────────────────────────┐
│  Supabase                                        │
│  ├── Auth (Login, Signup, Roles)                 │
│  ├── Database (44 Tabellen, RLS)                 │
│  ├── Realtime (Calls, Appointments, Leads)       │
│  └── Edge Functions (7 Deno-Functions)           │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  Externe APIs                                    │
│  ├── Stripe (Zahlungen)                          │
│  ├── Resend (E-Mails)                            │
│  └── VAPI (Telefon-KI)                           │
└─────────────────────────────────────────────────┘
```

## Features

| Bereich | Status | Beschreibung |
|---------|--------|-------------|
| **Dashboard** | ✅ | Metriken, Anrufe, Termine, Analytics, Assistenten |
| **Admin Panel** | ✅ | KPIs, User-Management, Impersonation, Bulk-Ops |
| **Sales CRM** | ✅ | Pipeline, Leads, Tasks, Kunden, Call-Protokolle |
| **Auth** | ✅ | Login, Signup, Password-Reset, Role-based Routing |
| **Billing** | ✅ | Pläne, Guthaben, Rechnungen, SEPA/Kreditkarte |
| **Integrations** | ✅ | 50+ Provider (CRM, Kalender, Telefon, E-Commerce) |
| **PWA** | ✅ | Installierbar, Offline-Cache, Push Notifications |
| **Onboarding** | ✅ | 5-Schritte Checklist mit Auto-Detection |
| **Realtime** | ✅ | Live-Updates für Calls, Appointments, Leads, Tasks |

## Tests

```bash
npm run test:unit    # 21 Vitest Unit Tests
npm test             # 124 Playwright E2E Tests
npm run test:all     # Alles
```

## Deployment

**GitHub Pages** (aktuell): Automatisch bei Push auf `main`.

**CI/CD**: GitHub Actions Pipeline (`.github/workflows/ci.yml`) mit:
- Unit Tests → Build → E2E Tests
- Playwright-Report als Artifact bei Fehlern

## Umgebungsvariablen

Für die Tests in GitHub Actions müssen folgende Secrets gesetzt werden:

| Secret | Beschreibung |
|--------|-------------|
| `SUPABASE_URL` | `https://fgwtptriileytmmotevs.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Public Key |
| `TEST_ADMIN_EMAIL` | Test-Admin E-Mail |
| `TEST_ADMIN_PASSWORD` | Test-Admin Passwort |
| `TEST_CUSTOMER_EMAIL` | Test-Customer E-Mail |
| `TEST_CUSTOMER_PASSWORD` | Test-Customer Passwort |

## Projektstruktur

Siehe [CLAUDE.md](CLAUDE.md) für die vollständige Dokumentation.

## Pläne & Preise

| Plan | Monatlich | Jährlich | Minuten |
|------|-----------|----------|---------|
| Starter | 149 € | 129 €/Mo | 340 |
| Professional | 299 € | 249 €/Mo | 560 |
| Business | Individuell | Individuell | Unbegrenzt |

## Lizenz

© 2026 Call Lana GmbH — Alle Rechte vorbehalten.
