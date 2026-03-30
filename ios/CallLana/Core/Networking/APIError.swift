// Unified error types for network and API operations

import Foundation

enum APIError: LocalizedError, Sendable {
    case notAuthenticated
    case networkUnavailable
    case serverError(statusCode: Int, message: String)
    case decodingFailed(underlying: Error)
    case unauthorized
    case notFound
    case rateLimited
    case unknown(underlying: Error)

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Nicht angemeldet. Bitte erneut einloggen."
        case .networkUnavailable:
            return "Keine Internetverbindung."
        case .serverError(let code, let message):
            return "Serverfehler (\(code)): \(message)"
        case .decodingFailed:
            return "Daten konnten nicht verarbeitet werden."
        case .unauthorized:
            return "Keine Berechtigung fuer diese Aktion."
        case .notFound:
            return "Die angeforderte Ressource wurde nicht gefunden."
        case .rateLimited:
            return "Zu viele Anfragen. Bitte warten Sie einen Moment."
        case .unknown:
            return "Ein unbekannter Fehler ist aufgetreten."
        }
    }
}
