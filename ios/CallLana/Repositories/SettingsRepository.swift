// SettingsRepository.swift — User settings data access layer
// Provides read/write access to the "user_settings" table.
// References db/calls.js (saveSettings, getSettings).

import Foundation
import Supabase

// MARK: - Models

struct UserSettings: Codable, Sendable {
    var notificationsEnabled: Bool?
    var language: String?
    var theme: String?
    var callRecordingEnabled: Bool?

    /// Allows arbitrary key-value pairs for extensibility.
    var additionalSettings: [String: AnyJSON]?

    enum CodingKeys: String, CodingKey {
        case notificationsEnabled = "notifications_enabled"
        case language
        case theme
        case callRecordingEnabled = "call_recording_enabled"
        case additionalSettings = "additional_settings"
    }
}

/// Row shape for the user_settings table.
private struct UserSettingsRow: Codable, Sendable {
    let userId: UUID
    let settings: UserSettings
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case settings
        case updatedAt = "updated_at"
    }
}

/// Response shape when selecting just the settings column.
private struct SettingsColumn: Codable, Sendable {
    let settings: UserSettings
}

// MARK: - Protocol

protocol SettingsRepositoryProtocol: Sendable {
    func getSettings() async throws -> UserSettings
    func saveSettings(_ settings: UserSettings) async throws
}

// MARK: - Implementation

final class SettingsRepository: SettingsRepositoryProtocol {
    private let client: SupabaseClient

    init(client: SupabaseClient) {
        self.client = client
    }

    /// Fetch the current user's settings.
    /// Returns default settings if no row exists (PGRST116).
    /// Mirrors `getSettings()` in db/calls.js.
    func getSettings() async throws -> UserSettings {
        let userId = try await currentUserId()

        do {
            let row: SettingsColumn = try await client
                .from("user_settings")
                .select("settings")
                .eq("user_id", value: userId)
                .single()
                .execute()
                .value

            return row.settings
        } catch {
            // If no row exists, return default settings
            if let postgrestError = error as? PostgrestError,
               postgrestError.code == "PGRST116" {
                return UserSettings()
            }
            throw error
        }
    }

    /// Upsert the current user's settings.
    /// Mirrors `saveSettings()` in db/calls.js.
    func saveSettings(_ settings: UserSettings) async throws {
        let userId = try await currentUserId()
        let formatter = ISO8601DateFormatter()

        let row = UserSettingsRow(
            userId: userId,
            settings: settings,
            updatedAt: formatter.string(from: Date())
        )

        try await client
            .from("user_settings")
            .upsert(row)
            .execute()
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
