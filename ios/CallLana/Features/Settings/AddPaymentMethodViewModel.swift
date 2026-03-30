// AddPaymentMethodViewModel.swift — Payment method form logic
// Handles validation, formatting, and saving of new payment methods.

import Foundation
import Observation
import Supabase

@Observable
final class AddPaymentMethodViewModel {
    // MARK: - Form State

    var selectedType: PaymentMethodType = .sepa
    var accountHolder = ""
    var iban = ""
    var sepaConsent = false
    var cardHolder = ""
    var cardNumber = ""
    var cardExpiry = ""
    var cardCvc = ""

    // MARK: - UI State

    private(set) var isLoading = false
    var errorMessage: String?
    var showSuccess = false
    var ibanHint = ""
    var ibanValidationError = ""
    var cardValidationError = ""

    // MARK: - Validation

    var isFormValid: Bool {
        switch selectedType {
        case .sepa:
            return !accountHolder.trimmingCharacters(in: .whitespaces).isEmpty
                && isIbanValid
                && sepaConsent
        case .creditCard:
            return !cardHolder.trimmingCharacters(in: .whitespaces).isEmpty
                && isCardNumberValid
                && isExpiryValid
                && cardCvc.count >= 3
        case .paypal:
            return false
        }
    }

    private var cleanIban: String {
        iban.replacingOccurrences(of: " ", with: "").uppercased()
    }

    private var isIbanValid: Bool {
        let clean = cleanIban
        guard clean.count >= 15, clean.count <= 34 else { return false }
        guard clean.hasPrefix("DE") || clean.hasPrefix("AT") || clean.hasPrefix("CH") else { return false }
        let countryLengths = ["DE": 22, "AT": 20, "CH": 21]
        let country = String(clean.prefix(2))
        if let expected = countryLengths[country], clean.count != expected { return false }
        return true
    }

    private var cleanCardNumber: String {
        cardNumber.replacingOccurrences(of: " ", with: "")
    }

    private var isCardNumberValid: Bool {
        let digits = cleanCardNumber
        return digits.count >= 13 && digits.count <= 19 && digits.allSatisfy(\.isNumber)
    }

    private var isExpiryValid: Bool {
        let pattern = /^\d{2}\/\d{2}$/
        return cardExpiry.contains(pattern)
    }

    // MARK: - Formatting

    func formatIban(_ value: String) {
        let clean = value.replacingOccurrences(of: " ", with: "").uppercased()
        let formatted = stride(from: 0, to: clean.count, by: 4).map { i in
            let start = clean.index(clean.startIndex, offsetBy: i)
            let end = clean.index(start, offsetBy: min(4, clean.count - i))
            return String(clean[start..<end])
        }.joined(separator: " ")
        iban = formatted

        let countryLabels = ["DE": "Deutschland (22 Zeichen)", "AT": "Oesterreich (20 Zeichen)", "CH": "Schweiz (21 Zeichen)"]
        if clean.count >= 2 {
            let country = String(clean.prefix(2))
            ibanHint = countryLabels[country] ?? ""
        } else {
            ibanHint = ""
        }
        ibanValidationError = clean.count > 4 && !isIbanValid ? "IBAN ungueltig" : ""
    }

    func formatCardNumber(_ value: String) {
        let digits = value.replacingOccurrences(of: " ", with: "").prefix(16)
        let formatted = stride(from: 0, to: digits.count, by: 4).map { i in
            let start = digits.index(digits.startIndex, offsetBy: i)
            let end = digits.index(start, offsetBy: min(4, digits.count - i))
            return String(digits[start..<end])
        }.joined(separator: " ")
        cardNumber = formatted
        cardValidationError = ""
    }

    func formatExpiry(_ value: String) {
        let digits = value.replacingOccurrences(of: "/", with: "").prefix(4)
        if digits.count >= 3 {
            cardExpiry = String(digits.prefix(2)) + "/" + String(digits.suffix(from: digits.index(digits.startIndex, offsetBy: 2)))
        } else {
            cardExpiry = String(digits)
        }
    }

    func limitCvc(_ value: String) {
        cardCvc = String(value.prefix(4).filter(\.isNumber))
    }

    // MARK: - Save

    @MainActor
    func savePaymentMethod() async {
        guard isFormValid else { return }

        isLoading = true
        do {
            let client = SupabaseClientFactory.shared
            let userId = try await client.auth.session.user.id

            var displayData: [String: AnyJSON] = [
                "user_id": .string(userId.uuidString),
                "type": .string(selectedType.rawValue),
                "priority": .integer(1),
                "status": .string("pending")
            ]

            if selectedType == .sepa {
                displayData["account_holder"] = .string(accountHolder.trimmingCharacters(in: .whitespaces))
                displayData["iban_last4"] = .string(String(cleanIban.suffix(4)))
                displayData["mandate_reference"] = .string("CLANA-\(Date.now.timeIntervalSince1970.formatted(.number.grouping(.never)))")
                displayData["mandate_date"] = .string(ISO8601DateFormatter().string(from: Date.now))
                displayData["mandate_confirmed"] = .bool(true)
            } else if selectedType == .creditCard {
                displayData["account_holder"] = .string(cardHolder.trimmingCharacters(in: .whitespaces))
                displayData["card_last4"] = .string(String(cleanCardNumber.suffix(4)))
                displayData["card_brand"] = .string(detectCardBrand(cleanCardNumber))
            }

            // In production: tokenize via Stripe edge function first
            try await client
                .from("payment_methods")
                .upsert(displayData)
                .execute()

            showSuccess = true
        } catch {
            errorMessage = "Zahlungsmethode konnte nicht gespeichert werden."
        }
        isLoading = false
    }

    // MARK: - Card Brand Detection

    private func detectCardBrand(_ number: String) -> String {
        if number.hasPrefix("4") { return "Visa" }
        if let first2 = Int(number.prefix(2)), (51...55).contains(first2) { return "Mastercard" }
        if number.hasPrefix("34") || number.hasPrefix("37") { return "Amex" }
        return "Karte"
    }
}
