// SettingsView.swift — Main settings screen with grouped sections
// Konto, Praeferenzen, Zahlung, App, Abmelden.

import SwiftUI

struct SettingsView: View {
    @State private var viewModel = SettingsViewModel()
    @State private var showSignOutConfirmation = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.profile == nil {
                    LoadingView(label: "Einstellungen werden geladen...")
                } else {
                    settingsList
                }
            }
            .navigationTitle("Einstellungen")
            .task {
                await viewModel.loadProfile()
            }
            .alert("Fehler", isPresented: .init(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
            .confirmationDialog(
                "Moechtest du dich wirklich abmelden?",
                isPresented: $showSignOutConfirmation,
                titleVisibility: .visible
            ) {
                Button("Abmelden", role: .destructive) {
                    viewModel.signOut()
                }
                Button("Abbrechen", role: .cancel) {}
            }
        }
    }

    // MARK: - Settings List

    private var settingsList: some View {
        List {
            accountSection
            preferencesSection
            paymentSection
            appSection
            signOutSection
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Konto

    private var accountSection: some View {
        Section("Konto") {
            NavigationLink {
                ProfileEditView(profile: viewModel.profile)
            } label: {
                Label {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Profil")
                            .foregroundStyle(.clText)
                        Text(viewModel.displayName)
                            .font(.caption)
                            .foregroundStyle(.clTextSecondary)
                    }
                } icon: {
                    Image(systemName: "person.circle.fill")
                        .foregroundStyle(.clPurple)
                }
            }

            NavigationLink {
                PasswordChangeView()
            } label: {
                Label {
                    Text("Sicherheit")
                        .foregroundStyle(.clText)
                } icon: {
                    Image(systemName: "lock.shield.fill")
                        .foregroundStyle(.clPurple)
                }
            }
        }
    }

    // MARK: - Praeferenzen

    private var preferencesSection: some View {
        Section("Praeferenzen") {
            NavigationLink {
                NotificationSettingsView()
            } label: {
                Label {
                    Text("Benachrichtigungen")
                        .foregroundStyle(.clText)
                } icon: {
                    Image(systemName: "bell.badge.fill")
                        .foregroundStyle(.clPurple)
                }
            }
        }
    }

    // MARK: - Zahlung

    private var paymentSection: some View {
        Section("Zahlung") {
            NavigationLink {
                PaymentMethodsView()
            } label: {
                Label {
                    Text("Zahlungsmethoden")
                        .foregroundStyle(.clText)
                } icon: {
                    Image(systemName: "creditcard.fill")
                        .foregroundStyle(.clPurple)
                }
            }
        }
    }

    // MARK: - App

    private var appSection: some View {
        Section("App") {
            HStack {
                Label {
                    Text("Version")
                        .foregroundStyle(.clText)
                } icon: {
                    Image(systemName: "info.circle.fill")
                        .foregroundStyle(.clPurple)
                }
                Spacer()
                Text(viewModel.appVersion)
                    .font(.subheadline)
                    .foregroundStyle(.clTextSecondary)
            }

            Toggle(isOn: $viewModel.isDarkModeEnabled) {
                Label {
                    Text("Dark Mode")
                        .foregroundStyle(.clText)
                } icon: {
                    Image(systemName: "moon.fill")
                        .foregroundStyle(.clPurple)
                }
            }
            .tint(.clPurple)
        }
    }

    // MARK: - Sign Out

    private var signOutSection: some View {
        Section {
            Button(role: .destructive) {
                showSignOutConfirmation = true
            } label: {
                HStack {
                    Spacer()
                    Label("Abmelden", systemImage: "rectangle.portrait.and.arrow.right")
                        .fontWeight(.semibold)
                    Spacer()
                }
            }
        }
    }
}

#Preview {
    SettingsView()
}
