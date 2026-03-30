// RepositoryError.swift — Shared error types for all repositories

import Foundation

enum RepositoryError: LocalizedError, Sendable {
    case notAuthenticated
    case notFound
    case invalidDateRange
    case validationFailed(String)

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User is not authenticated."
        case .notFound:
            return "The requested resource was not found."
        case .invalidDateRange:
            return "The specified date range is invalid."
        case .validationFailed(let reason):
            return "Validation failed: \(reason)"
        }
    }
}
