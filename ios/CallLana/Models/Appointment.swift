// Appointment model matching the appointments table (034_appointments.sql)

import Foundation

struct Appointment: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    var customerId: UUID?
    var customerName: String?
    var name: String?
    var phone: String?
    var appointmentDate: Date
    var durationMinutes: Int?
    var note: String?
    var status: AppointmentStatus?
    var source: AppointmentSource?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, phone, name, note, status, source
        case userId = "user_id"
        case customerId = "customer_id"
        case customerName = "customer_name"
        case appointmentDate = "appointment_date"
        case durationMinutes = "duration_minutes"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Enums

enum AppointmentStatus: String, Codable, Sendable {
    case confirmed
    case cancelled
    case completed
    case pending
}

enum AppointmentSource: String, Codable, Sendable {
    case lana
    case manual
    case calendar
}

// MARK: - Computed Properties

extension Appointment {
    var displayName: String {
        customerName ?? name ?? "Unbekannter Termin"
    }

    var isUpcoming: Bool {
        appointmentDate > Date()
    }
}
