// CallRepository.swift — Call data access layer
// Provides call history and statistics from the "calls" table.

import Foundation
import Supabase

// MARK: - Models

struct Call: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let phoneNumber: String?
    let duration: Int?
    let status: String?
    let transcript: String?
    let outcome: String?
    let sentimentScore: Double?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case phoneNumber = "phone_number"
        case duration
        case status
        case transcript
        case outcome
        case sentimentScore = "sentiment_score"
        case createdAt = "created_at"
    }
}

struct CallStats: Sendable {
    let totalCalls: Int
    let totalDuration: Int
    let avgDuration: Double
    let statuses: [String: Int]
}

// MARK: - Protocol

protocol CallRepositoryProtocol: Sendable {
    func getCalls(limit: Int) async throws -> [Call]
    func getCallStats(from startDate: Date, to endDate: Date) async throws -> CallStats
    func getCall(id: UUID) async throws -> Call
}

// MARK: - Implementation

final class CallRepository: CallRepositoryProtocol {
    private let client: SupabaseClient

    init(client: SupabaseClient) {
        self.client = client
    }

    func getCalls(limit: Int = 50) async throws -> [Call] {
        let userId = try await currentUserId()

        let calls: [Call] = try await client
            .from("calls")
            .select()
            .eq("user_id", value: userId)
            .order("created_at", ascending: false)
            .limit(limit)
            .execute()
            .value

        return calls
    }

    func getCallStats(from startDate: Date, to endDate: Date) async throws -> CallStats {
        let userId = try await currentUserId()
        let formatter = ISO8601DateFormatter()

        let calls: [Call] = try await client
            .from("calls")
            .select()
            .eq("user_id", value: userId)
            .gte("created_at", value: formatter.string(from: startDate))
            .lte("created_at", value: formatter.string(from: endDate))
            .execute()
            .value

        let totalCalls = calls.count
        let totalDuration = calls.reduce(0) { $0 + ($1.duration ?? 0) }
        let avgDuration = totalCalls > 0 ? Double(totalDuration) / Double(totalCalls) : 0

        var statuses: [String: Int] = [:]
        for call in calls {
            let status = call.status ?? "unknown"
            statuses[status, default: 0] += 1
        }

        return CallStats(
            totalCalls: totalCalls,
            totalDuration: totalDuration,
            avgDuration: avgDuration,
            statuses: statuses
        )
    }

    func getCall(id: UUID) async throws -> Call {
        let userId = try await currentUserId()

        let call: Call = try await client
            .from("calls")
            .select()
            .eq("id", value: id)
            .eq("user_id", value: userId)
            .single()
            .execute()
            .value

        return call
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
