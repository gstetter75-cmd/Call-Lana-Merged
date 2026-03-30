import Foundation
import Observation
import LocalAuthentication
import UIKit

@Observable
final class LoginViewModel {
    var email = ""
    var password = ""
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    var authService: AuthService?

    // MARK: - Computed

    var isFormValid: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        && !password.isEmpty
    }

    var isBiometricsAvailable: Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    // MARK: - Actions

    @MainActor
    func signIn() async {
        guard isFormValid else { return }

        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)

        isLoading = true
        errorMessage = nil

        do {
            try await authService?.signIn(email: trimmedEmail, password: password)
            HapticService.notification(.success)
        } catch {
            errorMessage = mapError(error)
            HapticService.notification(.error)
        }

        isLoading = false
    }

    @MainActor
    func signInWithBiometrics() async {
        let context = LAContext()
        context.localizedReason = "Melde dich mit Face ID an"

        isLoading = true
        errorMessage = nil

        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Anmeldung bei Call Lana"
            )

            guard success else {
                errorMessage = "Biometrische Authentifizierung fehlgeschlagen."
                HapticService.notification(.error)
                isLoading = false
                return
            }

            try await authService?.signInWithBiometrics()
            HapticService.notification(.success)
        } catch {
            errorMessage = mapError(error)
            HapticService.notification(.error)
        }

        isLoading = false
    }

    // MARK: - Private

    private func mapError(_ error: Error) -> String {
        if let laError = error as? LAError {
            switch laError.code {
            case .userCancel:
                return "Authentifizierung abgebrochen."
            case .biometryNotAvailable:
                return "Face ID ist nicht verfuegbar."
            case .biometryLockout:
                return "Face ID ist gesperrt. Bitte entsperre dein Geraet zuerst."
            default:
                return "Biometrische Authentifizierung fehlgeschlagen."
            }
        }

        return "Anmeldung fehlgeschlagen. Bitte pruefe deine Zugangsdaten."
    }
}
