import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = Tab.home

    var body: some View {
        TabView(selection: $selectedTab) {
            ForEach(Tab.allCases) { tab in
                tab.destination
                    .tabItem {
                        Label(tab.title, systemImage: tab.icon)
                    }
                    .tag(tab)
            }
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

        @ViewBuilder
        var destination: some View {
            switch self {
            case .home:
                HomePlaceholderView()
            case .calls:
                PlaceholderTabView(title: "Anrufe", icon: "phone.fill", description: "Deine Anrufliste erscheint hier.")
            case .assistants:
                PlaceholderTabView(title: "Assistenten", icon: "cpu.fill", description: "Verwalte deine KI-Assistenten.")
            case .billing:
                PlaceholderTabView(title: "Kosten", icon: "creditcard.fill", description: "Deine Abrechnungsuebersicht.")
            case .settings:
                PlaceholderTabView(title: "Einstellungen", icon: "gearshape.fill", description: "Konto- und App-Einstellungen.")
            }
        }
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
