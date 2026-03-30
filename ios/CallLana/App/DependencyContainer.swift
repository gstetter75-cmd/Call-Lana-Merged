import Foundation
import Observation

@Observable
final class DependencyContainer {
    let authService: AuthService
    let realtimeService: RealtimeService

    init() {
        self.authService = AuthService()
        self.realtimeService = RealtimeService()
    }
}

// MARK: - Auth Service

@Observable
final class AuthService {
    private(set) var isAuthenticated = false
    private(set) var currentUserId: String?

    func signIn(email: String, password: String) async throws {
        // TODO: Implement Supabase auth sign-in
        isAuthenticated = true
    }

    func signUp(email: String, password: String, firstName: String, lastName: String) async throws {
        // TODO: Implement Supabase auth sign-up
        isAuthenticated = true
    }

    func signOut() async throws {
        // TODO: Implement Supabase auth sign-out
        isAuthenticated = false
        currentUserId = nil
    }

    func signInWithBiometrics() async throws {
        // TODO: Retrieve stored credentials from Keychain, then sign in
        isAuthenticated = true
    }

    func restoreSession() async {
        // TODO: Check for existing Supabase session
    }
}

// MARK: - Realtime Service

@Observable
final class RealtimeService {
    private(set) var isConnected = false

    func connect() async {
        // TODO: Establish Supabase Realtime connection
        isConnected = true
    }

    func disconnect() async {
        // TODO: Tear down Supabase Realtime connection
        isConnected = false
    }
}
