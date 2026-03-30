// Profile model matching the profiles table (001_profiles.sql)

import Foundation

struct Profile: Codable, Identifiable, Sendable {
    let id: UUID
    var role: UserRole
    var organizationId: UUID?
    var firstName: String?
    var lastName: String?
    var email: String?
    var company: String?
    var industry: String?
    var phone: String?
    var avatarUrl: String?
    var isActive: Bool?
    var onboardingStatus: String?
    var monthlyMinutesLimit: Int?
    var minutesUsed: Int?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, role, email, company, industry, phone
        case organizationId = "organization_id"
        case firstName = "first_name"
        case lastName = "last_name"
        case avatarUrl = "avatar_url"
        case isActive = "is_active"
        case onboardingStatus = "onboarding_status"
        case monthlyMinutesLimit = "monthly_minutes_limit"
        case minutesUsed = "minutes_used"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - User Role

enum UserRole: String, Codable, Sendable {
    case superadmin
    case sales
    case customer
}

// MARK: - Computed Properties

extension Profile {
    var fullName: String {
        [firstName, lastName]
            .compactMap { $0 }
            .joined(separator: " ")
    }

    var displayName: String {
        let name = fullName
        return name.isEmpty ? (company ?? email ?? "Unbekannt") : name
    }
}
