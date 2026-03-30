// AppointmentRepository.swift — Appointment data access layer
// Provides read access to the "appointments" table.

import Foundation
import Supabase

// MARK: - Models

struct Appointment: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let title: String?
    let description: String?
    let startTime: Date
    let endTime: Date?
    let status: String?
    let leadId: UUID?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title
        case description
        case startTime = "start_time"
        case endTime = "end_time"
        case status
        case leadId = "lead_id"
        case createdAt = "created_at"
    }
}

// MARK: - Protocol

protocol AppointmentRepositoryProtocol: Sendable {
    func getAppointments(from startDate: Date, to endDate: Date) async throws -> [Appointment]
    func getTodayAppointments() async throws -> [Appointment]
}

// MARK: - Implementation

final class AppointmentRepository: AppointmentRepositoryProtocol {
    private let client: SupabaseClient

    init(client: SupabaseClient) {
        self.client = client
    }

    func getAppointments(from startDate: Date, to endDate: Date) async throws -> [Appointment] {
        let userId = try await currentUserId()
        let formatter = ISO8601DateFormatter()

        let appointments: [Appointment] = try await client
            .from("appointments")
            .select()
            .eq("user_id", value: userId)
            .gte("start_time", value: formatter.string(from: startDate))
            .lte("start_time", value: formatter.string(from: endDate))
            .order("start_time", ascending: true)
            .execute()
            .value

        return appointments
    }

    func getTodayAppointments() async throws -> [Appointment] {
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else {
            throw RepositoryError.invalidDateRange
        }

        return try await getAppointments(from: startOfDay, to: endOfDay)
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
