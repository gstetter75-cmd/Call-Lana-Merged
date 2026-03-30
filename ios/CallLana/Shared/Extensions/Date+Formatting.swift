import Foundation

extension Date {
    // MARK: - Shared Formatters (cached for performance)

    private static let germanLocale = Locale(identifier: "de_DE")

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = germanLocale
        formatter.dateFormat = "HH:mm"
        return formatter
    }()

    private static let fullDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = germanLocale
        formatter.dateFormat = "d. MMMM yyyy"
        return formatter
    }()

    private static let shortDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = germanLocale
        formatter.dateFormat = "dd.MM.yyyy"
        return formatter
    }()

    private static let dayOfWeekFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = germanLocale
        formatter.dateFormat = "EEEE"
        return formatter
    }()

    // MARK: - Formatting Properties

    /// Time string in 24h format, e.g. "14:30"
    var timeString: String {
        Self.timeFormatter.string(from: self)
    }

    /// Full date string, e.g. "29. März 2026"
    var dateString: String {
        Self.fullDateFormatter.string(from: self)
    }

    /// Relative date: "Heute", "Gestern", or "29.03.2026"
    var relativeDateString: String {
        let calendar = Calendar.current
        if calendar.isDateInToday(self) {
            return "Heute"
        } else if calendar.isDateInYesterday(self) {
            return "Gestern"
        } else {
            return Self.shortDateFormatter.string(from: self)
        }
    }

    /// Full day of week name, e.g. "Montag"
    var dayOfWeek: String {
        Self.dayOfWeekFormatter.string(from: self)
    }
}
