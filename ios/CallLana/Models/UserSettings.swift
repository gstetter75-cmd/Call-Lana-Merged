// UserSettings model matching the user_settings table
// Columns from: db/calls.js (saveSettings/getSettings)

import Foundation

struct UserSettings: Codable, Identifiable, Sendable {
    /// user_settings hat kein eigenes uuid-PK; user_id dient als ID
    var id: UUID { userId }

    let userId: UUID
    var settings: [String: AnyCodableValue]
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case settings
        case updatedAt = "updated_at"
    }
}

// MARK: - AnyCodableValue fuer dynamische settings-JSON

/// Typsicherer Wrapper fuer gemischte JSON-Werte im settings-Feld
enum AnyCodableValue: Codable, Sendable, Equatable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Int.self) {
            self = .int(value)
        } else if let value = try? container.decode(Double.self) {
            self = .double(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else {
            self = .null
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .double(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}
