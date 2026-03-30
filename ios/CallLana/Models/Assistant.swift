// Assistant model matching the assistants table
// Columns from: 003_update_assistants.sql, db/assistants.js, dashboard.js

import Foundation

struct Assistant: Codable, Identifiable, Sendable {
    let id: UUID
    var userId: UUID?
    var organizationId: UUID?
    var name: String?
    var phoneNumber: String?
    var status: String?
    var language: String?
    var greeting: String?
    var vapiId: String?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, name, status, language, greeting
        case userId = "user_id"
        case organizationId = "organization_id"
        case phoneNumber = "phone_number"
        case vapiId = "vapi_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Computed Properties

extension Assistant {
    var isLive: Bool {
        status == "live"
    }

    var displayName: String {
        name ?? "Unbenannter Assistent"
    }

    var displayPhoneNumber: String {
        phoneNumber ?? "Keine Nummer"
    }
}
