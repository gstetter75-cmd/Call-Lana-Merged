// Face ID / Touch ID authentication using LocalAuthentication

import Foundation
import LocalAuthentication

enum BiometricType: Sendable {
    case none
    case faceID
    case touchID
}

enum BiometricError: LocalizedError, Sendable {
    case notAvailable
    case authenticationFailed
    case userCancelled
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Biometrische Authentifizierung ist nicht verfuegbar."
        case .authenticationFailed:
            return "Authentifizierung fehlgeschlagen."
        case .userCancelled:
            return "Authentifizierung abgebrochen."
        case .unknown(let error):
            return error.localizedDescription
        }
    }
}

final class BiometricService: Sendable {

    static let shared = BiometricService()

    private init() {}

    // MARK: - Availability

    var availableBiometricType: BiometricType {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }
        switch context.biometryType {
        case .faceID:
            return .faceID
        case .touchID:
            return .touchID
        default:
            return .none
        }
    }

    var isBiometricAvailable: Bool {
        availableBiometricType != .none
    }

    // MARK: - Authentication

    /// Biometrische Authentifizierung durchfuehren
    func authenticate(reason: String = "Bitte authentifizieren Sie sich") async throws {
        let context = LAContext()
        context.localizedCancelTitle = "Abbrechen"

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw BiometricError.notAvailable
        }

        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            guard success else {
                throw BiometricError.authenticationFailed
            }
        } catch let laError as LAError {
            switch laError.code {
            case .userCancel, .appCancel:
                throw BiometricError.userCancelled
            case .biometryNotAvailable, .biometryNotEnrolled:
                throw BiometricError.notAvailable
            default:
                throw BiometricError.authenticationFailed
            }
        } catch {
            throw BiometricError.unknown(error)
        }
    }
}
