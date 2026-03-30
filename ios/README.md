# Call Lana iOS App

Native iPhone App für das Call Lana Kunden-Dashboard.

## Setup

1. Xcode 15+ öffnen
2. File → New → Project → iOS App (SwiftUI, Swift)
3. Projektname: "CallLana", Bundle ID: `de.call-lana.app`
4. Supabase SDK hinzufügen: File → Add Package Dependencies
   - URL: `https://github.com/supabase/supabase-swift.git`
   - Version: 2.0.0+
5. Alle Dateien aus `ios/CallLana/` ins Projekt kopieren
6. Build & Run (iOS 17+ Simulator oder Device)

## Architektur

- **MVVM + Repository Pattern** mit Swift Concurrency
- **Supabase Swift SDK** für Auth, DB, Realtime
- **SwiftUI** (iOS 17+) mit @Observable
- **Face ID / Touch ID** für biometrische Authentifizierung

## Struktur

```
CallLana/
├── App/           → Entry Point, DI Container
├── Config/        → Supabase URL/Key, Constants
├── Core/          → Auth, Networking, Realtime, Cache
├── Models/        → 11 Codable Structs (1:1 Supabase)
├── Repositories/  → 7 Repositories (Protocol + Implementation)
├── Features/      → Auth, Home, Calls, Assistants, Appointments, Billing, Settings
└── Shared/        → Components, Extensions, Modifiers
```

## Features

- Dashboard mit KPIs (Anrufe, Buchungsrate, Minuten, Sentiment)
- Anrufliste mit Transcript und Sentiment
- Assistenten verwalten (Name, Stimme, Status)
- Kostenkontrolle (Guthaben, Minuten, Hard Cap, Auto-Reload)
- Rechnungen und Transaktionen
- Termine (Heute/Woche)
- Profil und Einstellungen
- Push Notifications (APNs)
- Dark Mode
