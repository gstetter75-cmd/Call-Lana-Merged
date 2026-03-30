import SwiftUI

@main
struct CallLanaApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var container = DependencyContainer()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            AuthGate()
                .environment(container)
                .tint(Color.callLanaPurple)
        }
        .onChange(of: scenePhase) { oldPhase, newPhase in
            handleScenePhaseChange(from: oldPhase, to: newPhase)
        }
    }

    // MARK: - Private

    private func handleScenePhaseChange(from oldPhase: ScenePhase, to newPhase: ScenePhase) {
        switch newPhase {
        case .active:
            Task { await container.realtimeService.connect() }
        case .background:
            Task { await container.realtimeService.disconnect() }
        case .inactive:
            break
        @unknown default:
            break
        }
    }
}

// MARK: - Auth Gate

private struct AuthGate: View {
    @Environment(DependencyContainer.self) private var container

    var body: some View {
        Group {
            if container.authService.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: container.authService.isAuthenticated)
    }
}

// MARK: - Brand Color

extension Color {
    static let callLanaPurple = Color(red: 124 / 255, green: 58 / 255, blue: 237 / 255)
}
