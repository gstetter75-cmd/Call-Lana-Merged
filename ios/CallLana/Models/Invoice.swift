// Invoice model matching the invoices table (019_invoices.sql)

import Foundation

struct Invoice: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    var organizationId: UUID?
    var invoiceNumber: String
    var status: InvoiceStatus
    var invoiceDate: String  // date (YYYY-MM-DD)
    var dueDate: String      // date (YYYY-MM-DD)
    var periodStart: String  // date
    var periodEnd: String    // date
    var netAmountCents: Int
    var taxRate: Decimal
    var taxAmountCents: Int
    var grossAmountCents: Int
    var currency: String
    var recipientName: String
    var recipientStreet: String?
    var recipientZip: String?
    var recipientCity: String?
    var recipientCountry: String?
    var recipientVatId: String?
    var recipientEmail: String?
    var notes: String?
    var creditNoteFor: UUID?
    var pdfStoragePath: String?
    var emailSent: Bool?
    var emailSentAt: Date?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, status, currency, notes
        case userId = "user_id"
        case organizationId = "organization_id"
        case invoiceNumber = "invoice_number"
        case invoiceDate = "invoice_date"
        case dueDate = "due_date"
        case periodStart = "period_start"
        case periodEnd = "period_end"
        case netAmountCents = "net_amount_cents"
        case taxRate = "tax_rate"
        case taxAmountCents = "tax_amount_cents"
        case grossAmountCents = "gross_amount_cents"
        case recipientName = "recipient_name"
        case recipientStreet = "recipient_street"
        case recipientZip = "recipient_zip"
        case recipientCity = "recipient_city"
        case recipientCountry = "recipient_country"
        case recipientVatId = "recipient_vat_id"
        case recipientEmail = "recipient_email"
        case creditNoteFor = "credit_note_for"
        case pdfStoragePath = "pdf_storage_path"
        case emailSent = "email_sent"
        case emailSentAt = "email_sent_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Invoice Status

enum InvoiceStatus: String, Codable, Sendable {
    case draft
    case issued
    case paid
    case cancelled
    case credited
}
