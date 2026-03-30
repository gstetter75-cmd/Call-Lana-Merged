// PaymentMethod model matching the payment_methods table (012_payment_methods.sql)

import Foundation

struct PaymentMethod: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    var type: PaymentMethodType
    var priority: Int
    var stripeCustomerId: String?
    var stripePaymentMethodId: String?
    // SEPA (nur maskierte Daten)
    var ibanLast4: String?
    var accountHolder: String?
    var mandateReference: String?
    var mandateDate: Date?
    var mandateConfirmed: Bool?
    // Kreditkarte (nur maskierte Daten)
    var cardLast4: String?
    var cardBrand: String?
    // Status
    var status: PaymentMethodStatus
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, type, priority, status
        case userId = "user_id"
        case stripeCustomerId = "stripe_customer_id"
        case stripePaymentMethodId = "stripe_payment_method_id"
        case ibanLast4 = "iban_last4"
        case accountHolder = "account_holder"
        case mandateReference = "mandate_reference"
        case mandateDate = "mandate_date"
        case mandateConfirmed = "mandate_confirmed"
        case cardLast4 = "card_last4"
        case cardBrand = "card_brand"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Payment Method Type

enum PaymentMethodType: String, Codable, Sendable {
    case sepa
    case creditCard = "credit_card"
    case paypal
}

// MARK: - Payment Method Status

enum PaymentMethodStatus: String, Codable, Sendable {
    case active
    case pending
    case revoked
    case failed
}

// MARK: - Computed Properties

extension PaymentMethod {
    /// Ob dies die primaere Zahlungsmethode ist
    var isPrimary: Bool {
        priority == 1
    }

    /// Maskierte Anzeige der Zahlungsmethode
    var maskedDisplay: String {
        switch type {
        case .sepa:
            return "SEPA ****\(ibanLast4 ?? "----")"
        case .creditCard:
            let brand = cardBrand?.capitalized ?? "Karte"
            return "\(brand) ****\(cardLast4 ?? "----")"
        case .paypal:
            return "PayPal"
        }
    }
}
