// SettingsViewModel.swift — Settings data management
// Loads profile and handles sign-out.

import Foundation
import Observation
import Supabase

@Observable
final class SettingsViewModel {
    // MARK: - State

    private(set) var profile: Profile?
    private(set) var paymentMethods: [PaymentMethod] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?
    var isDarkModeEnabled = false

    // MARK: - Dependencies

    var profileRepository: ProfileRepositoryProtocol?
    var authService: AuthService?

    // MARK: - Computed

    var displayName: String {
        guard let profile else { return "Laden..." }
        let name = [profile.firstName, profile.lastName]
            .compactMap { $0 }
            .joined(separator: " ")
        return name.isEmpty ? (profile.email ?? "Unbekannt") : name
    }

    var email: String {
        profile?.email ?? ""
    }

    var appVersion: String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }

    // MARK: - Actions

    @MainActor
    func loadProfile() async {
        guard let repository = profileRepository else { return }

        isLoading = true
        errorMessage = nil

        do {
            profile = try await repository.getProfile()
        } catch {
            errorMessage = "Profil konnte nicht geladen werden."
        }

        isLoading = false
    }

    @MainActor
    func signOut() {
        Task {
            do {
                try await authService?.signOut()
            } catch {
                errorMessage = "Abmeldung fehlgeschlagen."
            }
        }
    }
}
