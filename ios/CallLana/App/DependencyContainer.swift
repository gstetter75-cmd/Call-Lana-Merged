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
