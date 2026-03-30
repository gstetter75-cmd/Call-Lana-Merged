// Organization model matching the organizations table (002_organizations.sql)

import Foundation

struct Organization: Codable, Identifiable, Sendable {
    let id: UUID
    var name: String
    var slug: String?
    var ownerId: UUID?
    var plan: OrganizationPlan?
    var maxUsers: Int?
    var isActive: Bool?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, name, slug, plan
        case ownerId = "owner_id"
        case maxUsers = "max_users"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Organization Plan

enum OrganizationPlan: String, Codable, Sendable {
    case solo
    case team
    case business
}
