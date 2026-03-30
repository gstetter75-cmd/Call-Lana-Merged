// AssistantRepository.swift — Assistant data access layer
// Provides CRUD operations for the "assistants" table.

import Foundation
import Supabase

// MARK: - Models

struct Assistant: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let name: String?
    let description: String?
    let vapiAssistantId: String?
    let config: [String: AnyJSON]?
    let createdAt: Date
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case description
        case vapiAssistantId = "vapi_assistant_id"
        case config
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Protocol

protocol AssistantRepositoryProtocol: Sendable {
    func getAssistants() async throws -> [Assistant]
    func getAssistant(id: UUID) async throws -> Assistant
    func updateAssistant(id: UUID, updates: [String: AnyJSON]) async throws -> Assistant
    func deleteAssistant(id: UUID) async throws
}

// MARK: - Implementation

final class AssistantRepository: AssistantRepositoryProtocol {
    private let client: SupabaseClient

    init(client: SupabaseClient) {
        self.client = client
    }

    func getAssistants() async throws -> [Assistant] {
        let userId = try await currentUserId()

        let assistants: [Assistant] = try await client
            .from("assistants")
            .select()
            .eq("user_id", value: userId)
            .order("created_at", ascending: false)
            .execute()
            .value

        return assistants
    }

    func getAssistant(id: UUID) async throws -> Assistant {
        let userId = try await currentUserId()

        let assistant: Assistant = try await client
            .from("assistants")
            .select()
            .eq("id", value: id)
            .eq("user_id", value: userId)
            .single()
            .execute()
            .value

        return assistant
    }

    func updateAssistant(id: UUID, updates: [String: AnyJSON]) async throws -> Assistant {
        let userId = try await currentUserId()

        let updated: Assistant = try await client
            .from("assistants")
            .update(updates)
            .eq("id", value: id)
            .eq("user_id", value: userId)
            .select()
            .single()
            .execute()
            .value

        return updated
    }

    func deleteAssistant(id: UUID) async throws {
        let userId = try await currentUserId()

        try await client
            .from("assistants")
            .delete()
            .eq("id", value: id)
            .eq("user_id", value: userId)
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
