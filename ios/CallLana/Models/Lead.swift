// Lead model matching the leads table (005_leads.sql)

import Foundation

struct Lead: Codable, Identifiable, Sendable {
    let id: UUID
    var organizationId: UUID?
    var assignedTo: UUID?
    var companyName: String
    var contactName: String?
    var email: String?
    var phone: String?
    var status: LeadStatus?
    var source: String?
    var value: Decimal?
    var notes: String?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, email, phone, status, source, value, notes
        case organizationId = "organization_id"
        case assignedTo = "assigned_to"
        case companyName = "company_name"
        case contactName = "contact_name"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Lead Status

enum LeadStatus: String, Codable, Sendable {
    case new
    case contacted
    case qualified
    case proposal
    case won
    case lost
}
