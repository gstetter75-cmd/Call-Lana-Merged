import Foundation
import Observation

@Observable
final class SignupViewModel {
    var firstName = ""
    var lastName = ""
    var email = ""
    var password = ""
    var confirmPassword = ""
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    var authService: AuthService?

    // MARK: - Validation

    var isFormValid: Bool {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedFirstName = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedLastName = lastName.trimmingCharacters(in: .whitespacesAndNewlines)

        return !trimmedEmail.isEmpty
            && !trimmedFirstName.isEmpty
            && !trimmedLastName.isEmpty
            && password.count >= 8
            && password == confirmPassword
    }

    var passwordMismatch: Bool {
        !confirmPassword.isEmpty && password != confirmPassword
    }

    var passwordTooShort: Bool {
        !password.isEmpty && password.count < 8
    }

    // MARK: - Actions

    @MainActor
    func signUp() async {
        guard isFormValid else {
            errorMessage = validationErrorMessage
            return
        }

        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedFirstName = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedLastName = lastName.trimmingCharacters(in: .whitespacesAndNewlines)

        isLoading = true
        errorMessage = nil

        do {
            try await authService?.signUp(
                email: trimmedEmail,
                password: password,
                firstName: trimmedFirstName,
                lastName: trimmedLastName
            )
        } catch {
            errorMessage = "Registrierung fehlgeschlagen. Bitte versuche es erneut."
        }

        isLoading = false
    }

    // MARK: - Private

    private var validationErrorMessage: String? {
        if passwordTooShort {
            return "Das Passwort muss mindestens 8 Zeichen lang sein."
        }
        if passwordMismatch {
            return "Die Passwoerter stimmen nicht ueberein."
        }
        return nil
    }
}
