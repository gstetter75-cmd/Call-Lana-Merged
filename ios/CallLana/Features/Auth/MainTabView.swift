import SwiftUI

struct MainTabView: View {
    @Environment(DependencyContainer.self) private var container
    @State private var selectedTab = Tab.home

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView(
                    callRepository: container.callRepository,
                    appointmentRepository: container.appointmentRepository,
                    leadRepository: container.leadRepository
                )
            }
            .tabItem { Label("Home", systemImage: "house.fill") }
            .tag(Tab.home)

            NavigationStack {
                CallListView(callRepository: container.callRepository)
            }
            .tabItem { Label("Anrufe", systemImage: "phone.fill") }
            .tag(Tab.calls)

            NavigationStack {
                AssistantListView(assistantRepository: container.assistantRepository)
            }
            .tabItem { Label("Assistenten", systemImage: "cpu.fill") }
            .tag(Tab.assistants)

            NavigationStack {
                BillingOverviewView()
            }
            .tabItem { Label("Kosten", systemImage: "creditcard.fill") }
            .tag(Tab.billing)

            NavigationStack {
                SettingsView()
            }
            .tabItem { Label("Mehr", systemImage: "gearshape.fill") }
            .tag(Tab.settings)
        }
        .tint(Color.callLanaPurple)
    }
}

// MARK: - Tab Definition

extension MainTabView {
    enum Tab: String, CaseIterable, Identifiable {
        case home
        case calls
        case assistants
        case billing
        case settings

        var id: String { rawValue }

        var title: String {
            switch self {
            case .home: "Home"
            case .calls: "Anrufe"
            case .assistants: "Assistenten"
            case .billing: "Kosten"
            case .settings: "Mehr"
            }
        }

        var icon: String {
            switch self {
            case .home: "house.fill"
            case .calls: "phone.fill"
            case .assistants: "cpu.fill"
            case .billing: "creditcard.fill"
            case .settings: "gearshape.fill"
            }
        }

        // destination is resolved in MainTabView.body to access container
        var destinationTag: String { rawValue }
    }
}

// MARK: - Home Placeholder

private struct HomePlaceholderView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Image(systemName: "phone.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(Color.callLanaPurple)

                Text("Willkommen bei Call Lana")
                    .font(.title2.bold())

                Text("Dein KI-Telefonassistent ist bereit.")
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Home")
        }
    }
}

// MARK: - Generic Placeholder

private struct PlaceholderTabView: View {
    let title: String
    let icon: String
    let description: String

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 48))
                    .foregroundStyle(Color.callLanaPurple.opacity(0.6))

                Text(description)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(.systemGroupedBackground))
            .navigationTitle(title)
        }
    }
}

#Preview {
    MainTabView()
        .environment(DependencyContainer())
}
