// BillingTransaction model matching the billing_transactions table (013_billing.sql)

import Foundation

struct BillingTransaction: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    var type: TransactionType
    var amountCents: Int
    var balanceAfterCents: Int?
    var description: String?
    var metadata: [String: String]?
    var status: TransactionStatus?
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, type, description, metadata, status
        case userId = "user_id"
        case amountCents = "amount_cents"
        case balanceAfterCents = "balance_after_cents"
        case createdAt = "created_at"
    }
}

// MARK: - Transaction Type

enum TransactionType: String, Codable, Sendable {
    case planCharge = "plan_charge"
    case topup
    case autoReload = "auto_reload"
    case usageCharge = "usage_charge"
    case refund
    case credit

    /// Ob der Typ eine positive Buchung darstellt
    var isPositive: Bool {
        switch self {
        case .topup, .autoReload, .refund, .credit:
            return true
        case .planCharge, .usageCharge:
            return false
        }
    }

    /// Deutscher Anzeigename
    var displayLabel: String {
        switch self {
        case .planCharge: return "Tarifgebuehr"
        case .topup: return "Aufladung"
        case .autoReload: return "Auto-Aufladung"
        case .usageCharge: return "Verbrauch"
        case .refund: return "Erstattung"
        case .credit: return "Gutschrift"
        }
    }
}

// MARK: - Transaction Status

enum TransactionStatus: String, Codable, Sendable {
    case completed
    case pending
    case failed
    case refunded
}
