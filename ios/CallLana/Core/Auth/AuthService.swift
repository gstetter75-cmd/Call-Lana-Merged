// Authentication service wrapping Supabase Auth
// Mirrors js/auth.js logic: signIn, signUp, signOut, session management

import Foundation
import Supabase
import Auth

@Observable
final class AuthService: @unchecked Sendable {

    // MARK: - Published State

    private(set) var currentUser: User?
    private(set) var currentSession: Session?
    private(set) var isAuthenticated = false
    private(set) var isLoading = false

    // MARK: - Dependencies

    private let client: SupabaseClient
    private let keychain: KeychainService
    private var authStateTask: Task<Void, Never>?

    // MARK: - Init

    init(
        client: SupabaseClient = SupabaseClientFactory.shared,
        keychain: KeychainService = .shared
    ) {
        self.client = client
        self.keychain = keychain
        startAuthStateListener()
    }

    deinit {
        authStateTask?.cancel()
    }

    // MARK: - Auth State Listener

    /// Lauscht auf Auth-Events (analog zu onAuthStateChange im Web)
    private func startAuthStateListener() {
        authStateTask = Task { [weak self] in
            guard let self else { return }
            for await (event, session) in self.client.auth.authStateChanges {
                await MainActor.run {
                    self.handleAuthEvent(event, session: session)
                }
            }
        }
    }

    @MainActor
    private func handleAuthEvent(_ event: AuthChangeEvent, session: Session?) {
        switch event {
        case .signedIn, .tokenRefreshed:
            currentSession = session
            currentUser = session?.user
            isAuthenticated = session != nil
            if let accessToken = session?.accessToken {
                keychain.save(accessToken, forKey: .accessToken)
            }
            if let refreshToken = session?.refreshToken {
                keychain.save(refreshToken, forKey: .refreshToken)
            }

        case .signedOut:
            currentSession = nil
            currentUser = nil
            isAuthenticated = false
            keychain.delete(forKey: .accessToken)
            keychain.delete(forKey: .refreshToken)

        default:
            break
        }
    }

    // MARK: - Sign In

    @MainActor
    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }

        do {
            let session = try await client.auth.signIn(
                email: email,
                password: password
            )
            currentSession = session
            currentUser = session.user
            isAuthenticated = true
        } catch {
            throw mapError(error)
        }
    }

    // MARK: - Sign Up

    @MainActor
    func signUp(
        email: String,
        password: String,
        firstName: String? = nil,
        lastName: String? = nil,
        company: String? = nil,
        industry: String? = nil
    ) async throws {
        isLoading = true
        defer { isLoading = false }

        var metadata: [String: AnyJSON] = [:]
        if let firstName { metadata["firstName"] = .string(firstName) }
        if let lastName { metadata["lastName"] = .string(lastName) }
        if let company { metadata["company"] = .string(company) }
        if let industry { metadata["industry"] = .string(industry) }

        do {
            let response = try await client.auth.signUp(
                email: email,
                password: password,
                data: metadata
            )
            currentUser = response.user
        } catch {
            throw mapError(error)
        }
    }

    // MARK: - Sign Out

    @MainActor
    func signOut() async throws {
        isLoading = true
        defer { isLoading = false }

        do {
            try await client.auth.signOut()
            currentSession = nil
            currentUser = nil
            isAuthenticated = false
        } catch {
            throw mapError(error)
        }
    }

    // MARK: - Get User

    @MainActor
    func refreshUser() async throws {
        let user = try await client.auth.user()
        currentUser = user
    }

    // MARK: - Session

    @MainActor
    func restoreSession() async {
        do {
            let session = try await client.auth.session
            currentSession = session
            currentUser = session.user
            isAuthenticated = true
        } catch {
            isAuthenticated = false
        }
    }

    // MARK: - Password Reset

    func resetPassword(email: String) async throws {
        try await client.auth.resetPasswordForEmail(email)
    }

    // MARK: - Error Mapping

    private func mapError(_ error: Error) -> APIError {
        if let authError = error as? AuthError {
            switch authError {
            default:
                return .serverError(statusCode: 0, message: authError.localizedDescription)
            }
        }
        return .unknown(underlying: error)
    }
}
