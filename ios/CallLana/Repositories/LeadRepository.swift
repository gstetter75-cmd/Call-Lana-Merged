// LeadRepository.swift — Lead data access layer
// Provides read access to the "leads" table with scoring support.

import Foundation
import Supabase

// MARK: - Models

struct Lead: Codable, Identifiable, Sendable {
    let id: UUID
    let name: String?
    let email: String?
    let phone: String?
    let company: String?
    let status: String?
    let score: Int?
    let assignedTo: UUID?
    let source: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case email
        case phone
        case company
        case status
        case score
        case assignedTo = "assigned_to"
        case source
        case createdAt = "created_at"
    }
}

// MARK: - Protocol

protocol LeadRepositoryProtocol: Sendable {
    func getLeads(limit: Int) async throws -> [Lead]
    func getTopLeads(limit: Int) async throws -> [Lead]
}

// MARK: - Implementation

final class LeadRepository: LeadRepositoryProtocol {
    private let client: SupabaseClient

    init(client: SupabaseClient) {
        self.client = client
    }

    func getLeads(limit: Int = 50) async throws -> [Lead] {
        let leads: [Lead] = try await client
            .from("leads")
            .select()
            .order("created_at", ascending: false)
            .limit(limit)
            .execute()
            .value

        return leads
    }

    func getTopLeads(limit: Int = 10) async throws -> [Lead] {
        let leads: [Lead] = try await client
            .from("leads")
            .select()
            .order("score", ascending: false)
            .limit(limit)
            .execute()
            .value

        return leads
    }
}
