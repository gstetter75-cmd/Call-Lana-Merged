import Foundation

extension Int {
    // MARK: - Shared Formatter (cached for performance)

    private static let eurFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "EUR"
        formatter.locale = Locale(identifier: "de_DE")
        return formatter
    }()

    /// Converts cents to formatted EUR string, e.g. 14900 → "149,00 €"
    var centsToEUR: String {
        let euros = Double(self) / 100.0
        return Self.eurFormatter.string(from: NSNumber(value: euros)) ?? "\(euros) €"
    }

    /// Converts cents to short EUR string (no decimals), e.g. 14900 → "149 €"
    var centsToShortEUR: String {
        let euros = self / 100
        return "\(euros) €"
    }
}
