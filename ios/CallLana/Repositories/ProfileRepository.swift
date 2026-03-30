// ProfileRepository.swift — Profile data access layer
// Provides read/update access to the "profiles" table
// with organization join. References db/profiles.js.

import Foundation
import Supabase

// MARK: - Models

struct Organization: Codable, Sendable {
    let name: String?
    let plan: String?
}

struct Profile: Codable, Identifiable, Sendable {
    let id: UUID
    let firstName: String?
    let lastName: String?
    let email: String?
    let phone: String?
    let role: String?
    let organizationId: UUID?
    let avatarUrl: String?
    let organizations: Organization?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case phone
        case role
        case organizationId = "organization_id"
        case avatarUrl = "avatar_url"
        case organizations
        case createdAt = "created_at"
    }
}

// MARK: - Protocol

protocol ProfileRepositoryProtocol: Sendable {
    func getProfile() async throws -> Profile
    func updateProfile(updates: [String: AnyJSON]) async throws -> Profile
}

// MARK: - Implementation

final class ProfileRepository: ProfileRepositoryProtocol {
    private let client: SupabaseClient

    init(client: SupabaseClient) {
        self.client = client
    }

    /// Fetch the current user's profile with organization join.
    /// Mirrors `getProfile()` in db/profiles.js which selects
    /// `*, organizations(name, plan)`.
    func getProfile() async throws -> Profile {
        let userId = try await currentUserId()

        let profile: Profile = try await client
            .from("profiles")
            .select("*, organizations(name, plan)")
            .eq("id", value: userId)
            .single()
            .execute()
            .value

        return profile
    }

    /// Update the current user's profile and return the updated row.
    /// Mirrors `updateProfile()` in db/profiles.js.
    func updateProfile(updates: [String: AnyJSON]) async throws -> Profile {
        let userId = try await currentUserId()

        let profile: Profile = try await client
            .from("profiles")
            .update(updates)
            .eq("id", value: userId)
            .select()
            .single()
            .execute()
            .value

        return profile
    }

    // MARK: - Private

    private func currentUserId() async throws -> UUID {
        let user = try await client.auth.session.user
        guard let userId = UUID(uuidString: user.id.uuidString) else {
            throw RepositoryError.notAuthenticated
        }
        return userId
    }
}
