// Call model matching the calls table
// Columns from: setup_complete.sql, db/calls.js, dashboard.js

import Foundation

struct Call: Codable, Identifiable, Sendable {
    let id: UUID
    var userId: UUID?
    var organizationId: UUID?
    var assistantId: UUID?
    var phoneNumber: String?
    var callerName: String?
    var duration: Int?
    var status: String?
    var transcript: String?
    var outcome: String?
    var sentimentScore: Double?
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, duration, status, transcript, outcome
        case userId = "user_id"
        case organizationId = "organization_id"
        case assistantId = "assistant_id"
        case phoneNumber = "phone_number"
        case callerName = "caller_name"
        case sentimentScore = "sentiment_score"
        case createdAt = "created_at"
    }
}

// MARK: - Computed Properties

extension Call {
    /// Dauer formatiert als "Xm Ys"
    var formattedDuration: String {
        guard let duration, duration > 0 else { return "0s" }
        let minutes = duration / 60
        let seconds = duration % 60
        if minutes > 0 {
            return "\(minutes)m \(seconds)s"
        }
        return "\(seconds)s"
    }

    var displayPhoneNumber: String {
        phoneNumber ?? "Unbekannt"
    }
}
