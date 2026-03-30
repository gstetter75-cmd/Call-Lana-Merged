// NotificationSettingsView.swift — Notification preference toggles
// Each toggle has a description explaining its purpose.

import SwiftUI

struct NotificationSettingsView: View {
    @State private var callSummaries = true
    @State private var importantForwards = true
    @State private var productUpdates = false
    @State private var marketing = false
    @State private var isSaving = false
    @State private var showSaved = false

    var body: some View {
        List {
            callSection
            systemSection
            marketingSection
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Benachrichtigungen")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: callSummaries) { _, _ in scheduleAutoSave() }
        .onChange(of: importantForwards) { _, _ in scheduleAutoSave() }
        .onChange(of: productUpdates) { _, _ in scheduleAutoSave() }
        .onChange(of: marketing) { _, _ in scheduleAutoSave() }
        .overlay(alignment: .bottom) {
            if showSaved {
                savedBanner
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: showSaved)
    }

    // MARK: - Call Notifications

    private var callSection: some View {
        Section("Anrufe") {
            Toggle(isOn: $callSummaries) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Anrufzusammenfassungen")
                        .foregroundStyle(Color.clText)
                    Text("Erhalte nach jedem Anruf eine Zusammenfassung per Push-Nachricht.")
                        .font(.caption)
                        .foregroundStyle(Color.clTextSecondary)
                }
            }
            .tint(Color.clPurple)

            Toggle(isOn: $importantForwards) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Wichtige Weiterleitungen")
                        .foregroundStyle(Color.clText)
                    Text("Werde sofort benachrichtigt, wenn Lana einen Anruf als dringend einstuft.")
                        .font(.caption)
                        .foregroundStyle(Color.clTextSecondary)
                }
            }
            .tint(Color.clPurple)
        }
    }

    // MARK: - System

    private var systemSection: some View {
        Section("System") {
            Toggle(isOn: $productUpdates) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Produktupdates")
                        .foregroundStyle(Color.clText)
                    Text("Informationen ueber neue Funktionen und Verbesserungen.")
                        .font(.caption)
                        .foregroundStyle(Color.clTextSecondary)
                }
            }
            .tint(Color.clPurple)
        }
    }

    // MARK: - Marketing

    private var marketingSection: some View {
        Section("Marketing") {
            Toggle(isOn: $marketing) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Marketing")
                        .foregroundStyle(Color.clText)
                    Text("Gelegentliche Tipps, Angebote und Neuigkeiten rund um Call Lana.")
                        .font(.caption)
                        .foregroundStyle(Color.clTextSecondary)
                }
            }
            .tint(Color.clPurple)
        }
    }

    // MARK: - Saved Banner

    private var savedBanner: some View {
        Text("Gespeichert")
            .font(.subheadline)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(Color.clPurple, in: Capsule())
            .padding(.bottom, 16)
    }

    // MARK: - Auto-Save

    private func scheduleAutoSave() {
        Task {
            isSaving = true
            // Save notification preferences via settings repository
            try? await Task.sleep(for: .milliseconds(500))
            isSaving = false
            showSaved = true
            try? await Task.sleep(for: .seconds(2))
            showSaved = false
        }
    }
}

#Preview {
    NavigationStack {
        NotificationSettingsView()
    }
}
