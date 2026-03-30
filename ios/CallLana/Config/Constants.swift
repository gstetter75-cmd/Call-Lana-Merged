// App-wide constants
// Billing values extracted from js/dashboard-billing.js

import Foundation

enum Constants {

    // MARK: - Billing

    enum Billing {
        /// Mindestbetrag fuer Top-Up: 5,00 EUR
        static let minTopUpCents = 500
        /// Maximalbetrag fuer Top-Up: 1.000,00 EUR
        static let maxTopUpCents = 100_000
        /// Standard Top-Up Betrag: 50,00 EUR
        static let defaultTopUpCents = 5_000
        /// Overage-Rate pro Minute: 0,15 EUR
        static let overageRateCents = 15
        /// Standard Hard-Cap: 300,00 EUR
        static let defaultHardCapCents = 30_000
        /// Standard Auto-Reload-Schwelle: 5,00 EUR
        static let defaultAutoReloadThresholdCents = 500
        /// Standard Auto-Reload-Betrag: 50,00 EUR
        static let defaultAutoReloadAmountCents = 5_000
        /// MwSt-Satz
        static let taxRate: Decimal = 19.00
        /// Waehrung
        static let currency = "EUR"
    }

    // MARK: - Pagination

    enum Pagination {
        static let defaultPageSize = 50
        static let transactionsPageSize = 20
    }

    // MARK: - Cache

    enum Cache {
        /// TTL fuer gecachte Daten (5 Minuten)
        static let defaultTTLSeconds: TimeInterval = 300
    }

    // MARK: - Date Formatting

    static let germanLocale = Locale(identifier: "de_DE")
}
